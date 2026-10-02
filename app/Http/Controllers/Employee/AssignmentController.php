<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\TrainingAssignment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        $assignments = TrainingAssignment::with('document.test')
            ->where('user_id', Auth::id())
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->orderBy('due_date')
            ->paginate(20)
            ->withQueryString()
            ->through(fn($a) => [
                'id'           => $a->id,
                'document'     => $a->document->display_name,
                'type'         => $a->training_type,
                'status'       => $a->status,
                'due_date'     => $a->due_date?->format('d.m.Y'),
                'completed_at' => $a->completed_at?->format('d.m.Y'),
                'test_status'  => $a->document->testStatus(),
            ]);

        return Inertia::render('Employee/Assignments/Index', compact('assignments'));
    }

    public function show(TrainingAssignment $assignment)
    {
        abort_if($assignment->user_id !== Auth::id(), 403);

        $assignment->load('document.test');

        // Документы «без теста» читаются точно так же, как и все остальные — единым экраном
        // ниже с таймером, просмотрщиком PDF и кнопкой «Я всё прочитал(а)». Раньше такие
        // документы (completion_mode=confirmation) уводились на отдельный экран-инструктаж
        // с видео и открывали PDF в новой вкладке — убрано: завершение для них уже и так
        // обрабатывается ниже тем же heartbeat() по отсутствию теста, видео-материалы на
        // проде не использовались (0 загруженных document_materials).

        $requiredSeconds = ($assignment->required_reading_minutes ?? 10) * 60;
        $spentSeconds    = $assignment->time_spent_seconds ?? 0;
        $isUnlocked      = $spentSeconds >= $requiredSeconds;

        return Inertia::render('Employee/Assignments/Show', [
            'assignment' => [
                'id'                 => $assignment->id,
                'document'           => [
                    'id'          => $assignment->document->id,
                    'title'       => $assignment->document->display_name,
                    'version'     => $assignment->document->version,
                    'description' => $assignment->document->description,
                ],
                'type'               => $assignment->training_type,
                'status'             => $assignment->status,
                'due_date'           => $assignment->due_date?->format('d.m.Y'),
                'started_at'         => $assignment->started_at?->format('d.m.Y H:i'),
                'time_spent_seconds'  => $spentSeconds,
                'required_seconds'    => $requiredSeconds,
                'is_unlocked'         => $isUnlocked,
                'has_test'            => $assignment->document->test !== null,
                // view_url только пока не истекло время чтения — сервер не даёт URL после разблокировки
                'view_url'            => (!$isUnlocked && in_array($assignment->status, ['pending', 'in_progress']))
                    ? route('documents.view', $assignment->document)
                    : null,
            ],
        ]);
    }

    public function start(TrainingAssignment $assignment)
    {
        abort_if($assignment->user_id !== Auth::id(), 403);

        if ($assignment->status === 'pending') {
            $assignment->update([
                'status'     => 'in_progress',
                'started_at' => now(),
            ]);
        }

        return response()->json(['status' => $assignment->fresh()->status]);
    }

    public function heartbeat(Request $request, TrainingAssignment $assignment)
    {
        abort_if($assignment->user_id !== Auth::id(), 403);

        // Принимаем точное суммарное время от фронтенда.
        // Только увеличиваем — никогда не уменьшаем (защита от манипуляций).
        $seconds = (int) $request->input('seconds', 0);
        $seconds = min(max($seconds, 0), 7200); // не больше 2 часов

        if ($seconds > $assignment->time_spent_seconds) {
            $assignment->time_spent_seconds = $seconds;
        }

        // У документа без теста экзамен не предусмотрен — как только время чтения набрано
        // (обычным отсчётом или кнопкой «Я всё прочитал(а)», которая шлёт сюда же полное
        // required_seconds), обучение завершается сразу, без него статус навечно остался бы
        // in_progress (переходить было бы больше некуда).
        if (in_array($assignment->status, ['pending', 'in_progress'], true)) {
            $requiredSeconds = ($assignment->required_reading_minutes ?? 10) * 60;

            if ($assignment->time_spent_seconds >= $requiredSeconds && ! $assignment->document->test) {
                $assignment->status       = 'completed';
                $assignment->completed_at = now();
            }
        }

        $assignment->save();

        return response()->json([
            'ok'                 => true,
            'status'             => $assignment->status,
            'time_spent_seconds' => $assignment->time_spent_seconds,
        ]);
    }
}
