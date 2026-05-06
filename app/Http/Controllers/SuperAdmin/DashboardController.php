<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\TrainingAssignment;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_users'         => User::count(),
            'active_employees'    => User::active()->employees()->count(),
            'total_documents'     => Document::active()->count(),
            'assignments_total'   => TrainingAssignment::count(),
            'assignments_done'    => TrainingAssignment::completed()->count(),
            'assignments_overdue' => TrainingAssignment::overdue()->count(),
        ];

        $roleStats = User::selectRaw('role, count(*) as cnt')
            ->groupBy('role')
            ->pluck('cnt', 'role')
            ->toArray();

        $recentUsers = User::with(['department'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn($u) => [
                'id'         => $u->id,
                'full_name'  => $u->full_name,
                'role'       => $u->role,
                'department' => $u->department?->name,
                'is_active'  => $u->is_active,
                'created_at' => $u->created_at->format('d.m.Y'),
            ]);

        return Inertia::render('SuperAdmin/Dashboard', compact('stats', 'roleStats', 'recentUsers'));
    }
}
