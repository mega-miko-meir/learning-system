<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\TrainingAssignment;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index()
    {
        $team = User::with(['department', 'position'])
            ->whereIn('id', Auth::user()->subordinateIds())
            ->active()
            ->get();

        $report = $team->map(function ($employee) {
            $total     = TrainingAssignment::where('user_id', $employee->id)->count();
            $completed = TrainingAssignment::where('user_id', $employee->id)->completed()->count();
            $overdue   = TrainingAssignment::where('user_id', $employee->id)->overdue()->count();

            return [
                'id'         => $employee->id,
                'full_name'  => $employee->full_name,
                'department' => $employee->department?->name ?? 'Без отдела',
                'position'   => $employee->position?->name,
                'total'      => $total,
                'completed'  => $completed,
                'overdue'    => $overdue,
                'percent'    => $total > 0 ? round($completed / $total * 100) : 0,
            ];
        });

        // Сводка по отделам — та же структура, что на странице «Отчёты» у admin (Admin/Reports/Index),
        // только посчитана по всей организационной вертикали текущего руководителя, а не по всем сотрудникам.
        $byDepartment = $report->groupBy('department')->map(function ($employees, $name) {
            $total     = $employees->sum('total');
            $completed = $employees->sum('completed');

            return [
                'name'      => $name,
                'employees' => $employees->count(),
                'total'     => $total,
                'completed' => $completed,
                'percent'   => $total > 0 ? round($completed / $total * 100) : 0,
            ];
        })->sortBy('name')->values();

        return Inertia::render('Manager/Reports/Index', compact('report', 'byDepartment'));
    }

    public function teamPdf()
    {
        $manager = Auth::user();

        $team = User::with(['department', 'position'])
            ->whereIn('id', $manager->subordinateIds())
            ->active()
            ->orderBy('last_name')
            ->get();

        $employees = $team->map(function ($emp) {
            $assignments = TrainingAssignment::with(['document', 'testAttempts'])
                ->where('user_id', $emp->id)
                ->latest()
                ->get();

            $total     = $assignments->count();
            $completed = $assignments->where('status', 'completed')->count();
            $pending   = $assignments->whereIn('status', ['pending', 'in_progress'])->count();
            $overdue   = $assignments->filter(fn($a) =>
                in_array($a->status, ['pending', 'in_progress']) && $a->due_date && $a->due_date->isPast()
            )->count();
            $percent   = $total > 0 ? round($completed / $total * 100) : 0;

            return [
                'user'        => $emp,
                'assignments' => $assignments,
                'total'       => $total,
                'completed'   => $completed,
                'pending'     => $pending,
                'overdue'     => $overdue,
                'percent'     => $percent,
            ];
        });

        $teamTotal     = $employees->sum('total');
        $teamCompleted = $employees->sum('completed');
        $teamOverdue   = $employees->sum('overdue');
        $teamPercent   = $teamTotal > 0 ? round($teamCompleted / $teamTotal * 100) : 0;

        // Группировка по отделам для PDF — тот же принцип, что и на странице отчёта.
        $employeesByDepartment = $employees
            ->groupBy(fn ($e) => $e['user']->department?->name ?? 'Без отдела')
            ->sortKeys();

        $pdf = Pdf::loadView('reports.team_pdf', compact(
            'manager', 'employees', 'employeesByDepartment', 'teamTotal', 'teamCompleted', 'teamOverdue', 'teamPercent'
        ))->setPaper('a4', 'portrait');

        $filename = 'team_report_' . now()->format('Ymd') . '.pdf';

        return $pdf->download($filename);
    }
}
