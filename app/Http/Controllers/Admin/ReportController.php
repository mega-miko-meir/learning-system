<?php

namespace App\Http\Controllers\Admin;

use App\Exports\TrainingRegistryExport;
use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\TrainingAssignment;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function index()
    {
        $summary = [
            'total_employees'     => User::active()->employees()->count(),
            'assignments_total'   => TrainingAssignment::count(),
            'assignments_done'    => TrainingAssignment::completed()->count(),
            'assignments_overdue' => TrainingAssignment::overdue()->count(),
        ];

        $byDepartment = Department::with(['users' => fn($q) => $q->employees()->active()])
            ->active()
            ->get()
            ->map(function ($dept) {
                $userIds   = $dept->users->pluck('id');
                $total     = TrainingAssignment::whereIn('user_id', $userIds)->count();
                $completed = TrainingAssignment::whereIn('user_id', $userIds)->completed()->count();

                return [
                    'id'        => $dept->id,
                    'name'      => $dept->name,
                    'employees' => $dept->users->count(),
                    'total'     => $total,
                    'completed' => $completed,
                    'percent'   => $total > 0 ? round($completed / $total * 100) : 0,
                ];
            })
            ->filter(fn($d) => $d['employees'] > 0)
            ->values();

        return Inertia::render('Admin/Reports/Index', compact('summary', 'byDepartment'));
    }

    public function employee(User $user)
    {
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

        return Inertia::render('Admin/Reports/Employee', [
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

    public function department(Department $department)
    {
        $employees = User::with('position')
            ->where('department_id', $department->id)
            ->active()
            ->get();

        $report = $employees->map(function ($emp) {
            $total     = TrainingAssignment::where('user_id', $emp->id)->count();
            $completed = TrainingAssignment::where('user_id', $emp->id)->completed()->count();
            $overdue   = TrainingAssignment::where('user_id', $emp->id)->overdue()->count();

            return [
                'id'        => $emp->id,
                'full_name' => $emp->full_name,
                'position'  => $emp->position?->name,
                'total'     => $total,
                'completed' => $completed,
                'overdue'   => $overdue,
                'percent'   => $total > 0 ? round($completed / $total * 100) : 0,
            ];
        });

        return Inertia::render('Admin/Reports/Department', [
            'department' => $department,
            'employees'  => $report,
        ]);
    }

    // ─── PDF-отчёт по сотруднику ─────────────────────────────
    public function employeePdf(User $user)
    {
        $user->load(['department', 'position', 'manager']);

        $assignments = TrainingAssignment::with(['document', 'testAttempts'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $total     = $assignments->count();
        $completed = $assignments->where('status', 'completed')->count();
        $pending   = $assignments->whereIn('status', ['pending', 'in_progress'])->count();
        $percent   = $total > 0 ? round($completed / $total * 100) : 0;

        $employee = $user; // алиас для шаблона

        $pdf = Pdf::loadView('reports.employee_pdf', compact(
            'employee', 'assignments', 'total', 'completed', 'pending', 'percent'
        ))->setPaper('a4', 'portrait');

        $filename = 'report_' . str_replace(' ', '_', $user->full_name) . '_' . now()->format('Ymd') . '.pdf';

        return $pdf->download($filename);
    }

    // ─── Excel-экспорт реестра ───────────────────────────────
    public function export(Request $request)
    {
        $export = new TrainingRegistryExport(
            departmentId: $request->integer('department_id') ?: null,
            status:       $request->input('status') ?: null,
            dateFrom:     $request->input('date_from') ?: null,
            dateTo:       $request->input('date_to') ?: null,
        );

        $filename = 'training_registry_' . now()->format('Ymd_His') . '.xlsx';

        return Excel::download($export, $filename);
    }
}
