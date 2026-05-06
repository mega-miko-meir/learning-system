<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\TrainingAssignment;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $manager = Auth::user();
        $teamIds = User::where('manager_id', $manager->id)->active()->pluck('id');

        $stats = [
            'team_size' => $teamIds->count(),
            'pending'   => TrainingAssignment::whereIn('user_id', $teamIds)->pending()->count(),
            'completed' => TrainingAssignment::whereIn('user_id', $teamIds)->completed()->count(),
            'overdue'   => TrainingAssignment::whereIn('user_id', $teamIds)->overdue()->count(),
        ];

        $recentActivity = TrainingAssignment::with(['user', 'document'])
            ->whereIn('user_id', $teamIds)
            ->whereIn('status', ['completed', 'failed'])
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(fn($a) => [
                'id'         => $a->id,
                'user'       => $a->user->short_name,
                'document'   => $a->document->title,
                'status'     => $a->status,
                'updated_at' => $a->updated_at->format('d.m.Y H:i'),
            ]);

        return Inertia::render('Manager/Dashboard', compact('stats', 'recentActivity'));
    }
}
