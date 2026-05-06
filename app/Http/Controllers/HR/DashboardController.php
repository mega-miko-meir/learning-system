<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_employees' => User::active()->employees()->count(),
            'total_inactive'  => User::where('is_active', false)->employees()->count(),
            'departments'     => Department::active()->count(),
        ];

        $recentHires = User::with(['department', 'position'])
            ->employees()
            ->active()
            ->orderByDesc('hired_at')
            ->limit(10)
            ->get()
            ->map(fn($u) => [
                'id'         => $u->id,
                'full_name'  => $u->full_name,
                'department' => $u->department?->name,
                'position'   => $u->position?->name,
                'hired_at'   => $u->hired_at?->format('d.m.Y'),
            ]);

        return Inertia::render('HR/Dashboard', compact('stats', 'recentHires'));
    }
}
