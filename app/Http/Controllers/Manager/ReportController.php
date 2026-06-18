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
            ->where('manager_id', Auth::id())
            ->active()
            ->get();

        $report = $team->map(function ($employee) {
            $total     = TrainingAssignment::where('user_id', $employee->id)->count();
            $completed = TrainingAssignment::where('user_id', $employee->id)->completed()->count();
            $overdue   = TrainingAssignment::where('user_id', $employee->id)->overdue()->count();

            return [
                'id'        => $employee->id,
                'full_name' => $employee->full_name,
                'position'  => $employee->position?->name,
                'total'     => $total,
                'completed' => $completed,
                'overdue'   => $overdue,
                'percent'   => $total > 0 ? round($completed / $total * 100) : 0,
            ];
        });

        return Inertia::render('Manager/Reports/Index', compact('report'));
    }

    public function teamPdf()
    {
        $manager = Auth::user();

        $team = User::with(['department', 'position'])
            ->where('manager_id', $manager->id)
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

        $pdf = Pdf::loadView('reports.team_pdf', compact(
            'manager', 'employees', 'teamTotal', 'teamCompleted', 'teamOverdue', 'teamPercent'
        ))->setPaper('a4', 'portrait');

        $filename = 'team_report_' . now()->format('Ymd') . '.pdf';

        return $pdf->download($filename);
    }
}
