<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\TrainingAssignment;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function index(Request $request)
    {
        $employees = User::with(['department', 'position'])
            ->where('manager_id', Auth::id())
            ->active()
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('last_name', 'like', "%$s%")
                      ->orWhere('first_name', 'like', "%$s%")
                )
            )
            ->orderBy('last_name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn($u) => [
                'id'         => $u->id,
                'full_name'  => $u->full_name,
                'department' => $u->department?->name,
                'position'   => $u->position?->name,
            ]);

        return Inertia::render('Manager/Employees/Index', compact('employees'));
    }

    public function show(User $user)
    {
        abort_if($user->manager_id !== Auth::id(), 403);

        $user->load(['department', 'position']);

        $assignments = TrainingAssignment::with([
                'document',
                'testAttempts.attemptAnswers.question',
                'testAttempts.attemptAnswers.answer',
            ])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn($a) => [
                'id'           => $a->id,
                'document'     => $a->document->title,
                'type'         => $a->training_type,
                'status'       => $a->status,
                'due_date'     => $a->due_date?->format('d.m.Y'),
                'completed_at' => $a->completed_at?->format('d.m.Y'),
                'best_score'   => $a->testAttempts->max('score_percentage'),
                'attempts'     => $a->testAttempts->map(fn($att) => [
                    'id'             => $att->id,
                    'attempt_number' => $att->attempt_number,
                    'score'          => $att->score_percentage,
                    'passed'         => $att->is_passed,
                    'finished_at'    => $att->finished_at?->format('d.m.Y H:i'),
                    'answers'        => $att->attemptAnswers->map(fn($aa) => [
                        'question'   => $aa->question?->question_text,
                        'chosen'     => $aa->answer?->answer_text,
                        'is_correct' => $aa->is_correct,
                    ]),
                ])->sortBy('attempt_number')->values(),
            ]);

        return Inertia::render('Manager/Employees/Show', [
            'employee' => [
                'id'         => $user->id,
                'full_name'  => $user->full_name,
                'department' => $user->department?->name,
                'position'   => $user->position?->name,
                'hired_at'   => $user->hired_at?->format('d.m.Y'),
            ],
            'assignments' => $assignments,
        ]);
    }

    public function pdf(User $user)
    {
        abort_if($user->manager_id !== Auth::id(), 403);

        $user->load(['department', 'position', 'manager']);

        $assignments = TrainingAssignment::with(['document', 'testAttempts'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $total     = $assignments->count();
        $completed = $assignments->where('status', 'completed')->count();
        $pending   = $assignments->whereIn('status', ['pending', 'in_progress'])->count();
        $percent   = $total > 0 ? round($completed / $total * 100) : 0;

        $employee = $user;

        $pdf = Pdf::loadView('reports.employee_pdf', compact(
            'employee', 'assignments', 'total', 'completed', 'pending', 'percent'
        ))->setPaper('a4', 'portrait');

        $filename = 'report_' . str_replace(' ', '_', $user->full_name) . '_' . now()->format('Ymd') . '.pdf';

        return $pdf->download($filename);
    }
}
