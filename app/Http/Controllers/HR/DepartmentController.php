<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::withCount(['users' => fn($q) => $q->active()->employees()])
            ->active()
            ->orderBy('name')
            ->get()
            ->map(fn($d) => [
                'id'          => $d->id,
                'name'        => $d->name,
                'users_count' => $d->users_count,
            ]);

        return Inertia::render('HR/Departments/Index', compact('departments'));
    }
}
