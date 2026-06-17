<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::withCount(['users' => fn($q) => $q->active()->employees()])
            ->with('manager')
            ->active()
            ->orderBy('name')
            ->get()
            ->map(fn($d) => [
                'id'          => $d->id,
                'name'        => $d->name,
                'code'        => $d->code,
                'short_name'  => $d->short_name,
                'users_count' => $d->users_count,
                'manager'     => $d->manager?->full_name,
            ]);

        return Inertia::render('HR/Departments/Index', compact('departments'));
    }

    public function create()
    {
        return Inertia::render('HR/Departments/Form', [
            'department' => null,
            'managers'   => $this->managers(),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'       => ['required', 'string', 'max:150', 'unique:departments,name'],
            'code'       => ['nullable', 'string', 'max:10'],
            'short_name' => ['nullable', 'string', 'max:50'],
            'manager_id' => ['nullable', 'exists:users,id'],
        ]);

        Department::create([...$data, 'is_active' => true]);

        return redirect()->route('hr.departments.index')->with('success', 'Отдел создан.');
    }

    public function edit(Department $department)
    {
        return Inertia::render('HR/Departments/Form', [
            'department' => [
                'id'         => $department->id,
                'name'       => $department->name,
                'code'       => $department->code,
                'short_name' => $department->short_name,
                'manager_id' => $department->manager_id,
            ],
            'managers' => $this->managers(),
        ]);
    }

    public function update(Request $request, Department $department)
    {
        $data = $request->validate([
            'name'       => ['required', 'string', 'max:150', Rule::unique('departments', 'name')->ignore($department->id)],
            'code'       => ['nullable', 'string', 'max:10'],
            'short_name' => ['nullable', 'string', 'max:50'],
            'manager_id' => ['nullable', 'exists:users,id'],
        ]);

        $department->update($data);

        return redirect()->route('hr.departments.index')->with('success', 'Отдел обновлён.');
    }

    private function managers()
    {
        return User::active()->whereIn('role', ['manager', 'admin'])
            ->orderBy('last_name')->get(['id', 'last_name', 'first_name', 'middle_name']);
    }
}
