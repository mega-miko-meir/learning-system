<?php

namespace App\Http\Controllers\Employee;

use App\Http\Controllers\Controller;
use App\Models\TrainingAssignment;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $stats = [
            'pending'   => TrainingAssignment::where('user_id', $user->id)->pending()->count(),
            'completed' => TrainingAssignment::where('user_id', $user->id)->completed()->count(),
            'overdue'   => TrainingAssignment::where('user_id', $user->id)->overdue()->count(),
        ];

        $upcoming = TrainingAssignment::with('document')
            ->where('user_id', $user->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->orderBy('due_date')
            ->limit(5)
            ->get()
            ->map(fn($a) => [
                'id'       => $a->id,
                'document' => $a->document->title,
                'type'     => $a->training_type,
                'status'   => $a->status,
                'due_date' => $a->due_date?->format('d.m.Y'),
            ]);

        return Inertia::render('Employee/Dashboard', compact('stats', 'upcoming'));
    }
}
