<?php

namespace App\Http\Controllers\Admin;

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
        $departments = Department::withCount(['users' => fn($q) => $q->active()])
            ->with('manager')
            ->orderBy('name')
            ->paginate(20)
            ->through(fn($d) => [
                'id'          => $d->id,
                'name'        => $d->name,
                'code'        => $d->code,
                'short_name'  => $d->short_name,
                'is_active'   => $d->is_active,
                'users_count' => $d->users_count,
                'manager'     => $d->manager?->full_name,
            ]);

        return Inertia::render('Admin/Departments/Index', compact('departments'));
    }

    public function create()
    {
        return Inertia::render('Admin/Departments/Form', [
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

        return redirect()->route('admin.departments.index')->with('success', 'Отдел создан.');
    }

    public function show(Department $department)
    {
        $department->load(['positions', 'manager']);

        return Inertia::render('Admin/Departments/Show', compact('department'));
    }

    public function edit(Department $department)
    {
        return Inertia::render('Admin/Departments/Form', [
            'department' => [
                'id'         => $department->id,
                'name'       => $department->name,
                'code'       => $department->code,
                'short_name' => $department->short_name,
                'manager_id' => $department->manager_id,
                'is_active'  => $department->is_active,
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
            'is_active'  => ['boolean'],
        ]);

        $department->update($data);

        return redirect()->route('admin.departments.index')->with('success', 'Отдел обновлён.');
    }

    private function managers()
    {
        return User::active()->whereIn('role', ['manager', 'admin'])
            ->orderBy('last_name')->get(['id', 'last_name', 'first_name', 'middle_name']);
    }

    public function destroy(Department $department)
    {
        $department->update(['is_active' => false]);

        return back()->with('success', 'Отдел деактивирован.');
    }
}
