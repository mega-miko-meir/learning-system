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
        $assignments = TrainingAssignment::with('document')
            ->where('user_id', Auth::id())
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->orderBy('due_date')
            ->paginate(20)
            ->withQueryString()
            ->through(fn($a) => [
                'id'           => $a->id,
                'document'     => $a->document->title,
                'type'         => $a->training_type,
                'status'       => $a->status,
                'due_date'     => $a->due_date?->format('d.m.Y'),
                'completed_at' => $a->completed_at?->format('d.m.Y'),
            ]);

        return Inertia::render('Employee/Assignments/Index', compact('assignments'));
    }

    public function show(TrainingAssignment $assignment)
    {
        abort_if($assignment->user_id !== Auth::id(), 403);

        $assignment->load('document.test');

        $requiredSeconds = ($assignment->required_reading_minutes ?? 10) * 60;
        $spentSeconds    = $assignment->time_spent_seconds ?? 0;
        $isUnlocked      = $spentSeconds >= $requiredSeconds;

        return Inertia::render('Employee/Assignments/Show', [
            'assignment' => [
                'id'                 => $assignment->id,
                'document'           => [
                    'id'          => $assignment->document->id,
                    'title'       => $assignment->document->title,
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
            $assignment->update(['time_spent_seconds' => $seconds]);
        }

        return response()->json([
            'ok'                 => true,
            'time_spent_seconds' => $assignment->time_spent_seconds,
        ]);
    }
}
