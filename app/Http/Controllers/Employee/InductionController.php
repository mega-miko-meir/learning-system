<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\DocumentMaterial;
use App\Models\TrainingAssignment;
use App\Services\InductionProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

// Прохождение обучения без теста (первичный инструктаж). Тесты и обычные курсы этим контроллером не затрагиваются.
class InductionController extends Controller
{
    public function show(TrainingAssignment $assignment)
    {
        abort_if($assignment->user_id !== Auth::id(), 403);
        $assignment->loadMissing('document');

        $progress = $assignment->materialProgress()->get()->keyBy('material_id');

        $materials = $assignment->document->materials()->get()->map(function ($m) use ($progress, $assignment) {
            $p        = $progress->get($m->id);
            $duration = (int) $m->duration_seconds;
            $max      = (int) ($p?->max_position_seconds ?? 0);

            return [
                'id'                   => $m->id,
                'kind'                 => $m->kind,
                'title'                => $m->title,
                'body'                 => $m->body,
                'is_required'          => $m->is_required,
                'duration_seconds'     => $duration,
                'max_position_seconds' => $max,
                'percent'              => $duration > 0 ? min(100, (int) floor($max / $duration * 100)) : 0,
                'completed'            => (bool) $p?->completed_at,
                'stream_url'           => $m->isVideo() ? route('employee.induction.video', [$assignment, $m]) : null,
            ];
        })->values();

        return Inertia::render('Employee/Assignments/Induction', [
            'assignment' => [
                'id'           => $assignment->id,
                'status'       => $assignment->status,
                'due_date'     => $assignment->due_date?->format('d.m.Y'),
                'completed_at' => $assignment->completed_at?->format('d.m.Y H:i'),
                'acknowledged' => (bool) $assignment->acknowledged_at,
                'document'     => [
                    'id'          => $assignment->document->id,
                    'title'       => $assignment->document->display_name,
                    'description' => $assignment->document->description,
                    'view_url'    => route('documents.view', $assignment->document),
                ],
            ],
            'materials'         => $materials,
            'videos_done'       => InductionProgress::videosDone($assignment),
            'threshold_percent' => (int) (InductionProgress::WATCH_THRESHOLD * 100),
        ]);
    }

    public function video(TrainingAssignment $assignment, DocumentMaterial $material)
    {
        $this->authorizeMaterial($assignment, $material);

        abort_if(!$material->isVideo() || !$material->file_path, 404);

        $path = Storage::disk('local')->path($material->file_path);
        abort_if(!file_exists($path), 404);

        // BinaryFileResponse сам обрабатывает Range-запросы (перемотка, докачка).
        return response()->file($path, [
            'Content-Type'           => $this->videoMime($path),
            'Cache-Control'          => 'private, no-transform',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function progress(Request $request, TrainingAssignment $assignment, DocumentMaterial $material)
    {
        $this->authorizeMaterial($assignment, $material);
        abort_if(!$material->isVideo(), 404);

        $data = $request->validate([
            'position' => ['required', 'integer', 'min:0'],
            'duration' => ['nullable', 'integer', 'min:1'],
        ]);

        if (in_array($assignment->status, ['pending', 'in_progress'])) {
            $progress = InductionProgress::recordVideoProgress(
                $assignment, $material, (int) $data['position'], $data['duration'] ?? null,
            );
            $material->refresh();
        } else {
            $progress = $assignment->materialProgress()->where('material_id', $material->id)->first();
        }

        $duration = (int) $material->duration_seconds;
        $maxPos   = (int) ($progress?->max_position_seconds ?? 0);

        return response()->json([
            'max_position_seconds' => $maxPos,
            'duration_seconds'     => $duration,
            'percent'              => $duration > 0 ? min(100, (int) floor($maxPos / $duration * 100)) : 0,
            'completed'            => (bool) $progress?->completed_at,
            'assignment_status'    => $assignment->fresh()->status,
        ]);
    }

    public function acknowledge(TrainingAssignment $assignment)
    {
        abort_if($assignment->user_id !== Auth::id(), 403);
        $assignment->loadMissing('document');
        abort_if(!$assignment->document->isConfirmationMode(), 404);

        if (!in_array($assignment->status, ['pending', 'in_progress'])) {
            return back();
        }

        if (!InductionProgress::acknowledge($assignment)) {
            return back()->with('error', 'Сначала просмотрите все обязательные видео до конца.');
        }

        return back()->with('success', 'Ознакомление подтверждено. Инструктаж пройден.');
    }

    private function authorizeMaterial(TrainingAssignment $assignment, DocumentMaterial $material): void
    {
        abort_if($assignment->user_id !== Auth::id(), 403);
        $assignment->loadMissing('document');
        abort_if(!$assignment->document->isConfirmationMode(), 404);
        abort_if($material->document_id !== $assignment->document_id, 404);
    }

    private function videoMime(string $path): string
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'webm'  => 'video/webm',
            'mov'   => 'video/quicktime',
            default => 'video/mp4',
        };
    }
}
