<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\TrainingAssignment;
use App\Models\User;
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
}
