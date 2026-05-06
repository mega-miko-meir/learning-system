<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\TrainingAssignment;
use App\Models\User;
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

        $assignments = TrainingAssignment::with(['document', 'testAttempts'])
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
}
