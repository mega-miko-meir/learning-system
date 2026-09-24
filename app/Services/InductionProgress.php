<?php

namespace App\Services;

use App\Models\AssignmentMaterialProgress;
use App\Models\AuditLog;
use App\Models\DocumentMaterial;
use App\Models\TrainingAssignment;

// Прохождение обучения без теста (первичный инструктаж): просмотр видео + подтверждение ознакомления.
// Работает только для документов с completion_mode = 'confirmation'; логика тестов не затрагивается.
class InductionProgress
{
    // Доля длительности ролика, после которой просмотр считается завершённым.
    public const WATCH_THRESHOLD = 0.9;

    // Сколько секунд «реального времени» между двумя сигналами плеера учитываем (пауза не копит запас).
    private const MAX_HEARTBEAT_GAP = 30;

    // Допустимая скорость воспроизведения (2x) + фиксированный запас на дрожание таймеров.
    private const SPEED_TOLERANCE = 2;
    private const SLACK_SECONDS   = 10;

    private const MAX_DURATION_SECONDS = 4 * 3600;

    /**
     * Фиксирует позицию просмотра. Позиция только растёт и не может опережать реальное время воспроизведения,
     * поэтому «перемотка в конец» или прямой запрос с position=duration не засчитываются.
     */
    public static function recordVideoProgress(
        TrainingAssignment $assignment,
        DocumentMaterial $material,
        int $position,
        ?int $reportedDuration = null,
    ): AssignmentMaterialProgress {
        // Длительность задаёт админ при загрузке; если её нет — принимаем от плеера один раз.
        if (!$material->duration_seconds && $reportedDuration && $reportedDuration > 0) {
            $material->update(['duration_seconds' => min($reportedDuration, self::MAX_DURATION_SECONDS)]);
        }
        $duration = (int) $material->duration_seconds;

        $progress = AssignmentMaterialProgress::firstOrNew([
            'assignment_id' => $assignment->id,
            'material_id'   => $material->id,
        ]);

        $now     = now();
        $prevMax = (int) $progress->max_position_seconds;

        $elapsed = $progress->last_heartbeat_at
            ? min(self::MAX_HEARTBEAT_GAP, max(0, $now->getTimestamp() - $progress->last_heartbeat_at->getTimestamp()))
            : 0;

        $cap    = $prevMax + (int) ceil($elapsed * self::SPEED_TOLERANCE) + self::SLACK_SECONDS;
        $newMax = max($prevMax, min(max($position, 0), $cap));
        if ($duration > 0) {
            $newMax = min($newMax, $duration);
        }

        $progress->max_position_seconds = $newMax;
        $progress->last_heartbeat_at    = $now;

        if (!$progress->completed_at && $duration > 0 && $newMax >= $duration * self::WATCH_THRESHOLD) {
            $progress->completed_at = $now;
        }

        $progress->save();

        self::refresh($assignment);

        return $progress;
    }

    // Все обязательные видео просмотрены до порога?
    public static function videosDone(TrainingAssignment $assignment): bool
    {
        $requiredIds = $assignment->document->materials()
            ->where('kind', DocumentMaterial::KIND_VIDEO)
            ->where('is_required', true)
            ->pluck('id');

        if ($requiredIds->isEmpty()) {
            return true;
        }

        return $assignment->materialProgress()
            ->whereIn('material_id', $requiredIds)
            ->whereNotNull('completed_at')
            ->count() >= $requiredIds->count();
    }

    // Подтверждение ознакомления: возможно только после просмотра всех обязательных видео.
    public static function acknowledge(TrainingAssignment $assignment): bool
    {
        if (!self::videosDone($assignment)) {
            return false;
        }

        if (!$assignment->acknowledged_at) {
            $assignment->acknowledged_at = now();
            $assignment->save();
        }

        self::refresh($assignment);

        return true;
    }

    // Единственное место, где назначение без теста переводится в in_progress / completed.
    public static function refresh(TrainingAssignment $assignment): void
    {
        $assignment->loadMissing('document', 'user');

        if (!$assignment->document->isConfirmationMode()
            || !in_array($assignment->status, ['pending', 'in_progress'])) {
            return;
        }

        if ($assignment->status === 'pending') {
            $assignment->status     = 'in_progress';
            $assignment->started_at = $assignment->started_at ?? now();
        }

        $justCompleted = false;
        if ($assignment->acknowledged_at && self::videosDone($assignment)) {
            $assignment->status       = 'completed';
            $assignment->completed_at = now();
            $justCompleted = true;
        }

        $assignment->save();

        if ($justCompleted) {
            AuditLog::create([
                'user_id'     => $assignment->user_id,
                'user_name'   => $assignment->user->full_name,
                'action'      => 'complete',
                'model_type'  => 'TrainingAssignment',
                'model_id'    => $assignment->id,
                'ip_address'  => request()->ip(),
                'description' => "Обучение без теста пройдено: {$assignment->document->display_name} ({$assignment->user->full_name})",
                'created_at'  => now(),
            ]);
        }
    }
}
