<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Document;
use App\Models\TrainingAssignment;
use App\Models\User;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_employees'    => User::active()->employees()->count(),
            'total_documents'    => Document::active()->count(),
            'assignments_total'  => TrainingAssignment::count(),
            'assignments_done'   => TrainingAssignment::completed()->count(),
            'assignments_overdue'=> TrainingAssignment::overdue()->count(),
            'assignments_pending'=> TrainingAssignment::pending()->count(),
        ];

        // Прогресс по отделам
        $departments = Department::with(['users' => fn($q) => $q->employees()->active()])
            ->active()
            ->get()
            ->map(function ($dept) {
                $userIds = $dept->users->pluck('id');
                if ($userIds->isEmpty()) return null;

                $total    = TrainingAssignment::whereIn('user_id', $userIds)->count();
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
            ->filter()
            ->values();

        // Последние активности
        $recent = TrainingAssignment::with(['user', 'document'])
            ->whereIn('status', ['completed', 'failed'])
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(fn($a) => [
                'id'        => $a->id,
                'user'      => $a->user->short_name,
                'document'  => $a->document->title,
                'status'    => $a->status,
                'updated_at'=> $a->updated_at->format('d.m.Y H:i'),
            ]);

        return Inertia::render('Admin/Dashboard', compact('stats', 'departments', 'recent'));
    }
}
