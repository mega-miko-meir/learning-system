<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::withCount('users')
            ->orderBy('name')
            ->paginate(20)
            ->through(fn($d) => [
                'id'          => $d->id,
                'name'        => $d->name,
                'is_active'   => $d->is_active,
                'users_count' => $d->users_count,
            ]);

        return Inertia::render('Admin/Departments/Index', compact('departments'));
    }

    public function create()
    {
        return Inertia::render('Admin/Departments/Form', ['department' => null]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150', 'unique:departments,name'],
        ]);

        Department::create([...$data, 'is_active' => true]);

        return redirect()->route('admin.departments.index')->with('success', 'Отдел создан.');
    }

    public function show(Department $department)
    {
        $department->load('positions');

        return Inertia::render('Admin/Departments/Show', compact('department'));
    }

    public function edit(Department $department)
    {
        return Inertia::render('Admin/Departments/Form', compact('department'));
    }

    public function update(Request $request, Department $department)
    {
        $data = $request->validate([
            'name'      => ['required', 'string', 'max:150', Rule::unique('departments', 'name')->ignore($department->id)],
            'is_active' => ['boolean'],
        ]);

        $department->update($data);

        return redirect()->route('admin.departments.index')->with('success', 'Отдел обновлён.');
    }

    public function destroy(Department $department)
    {
        $department->update(['is_active' => false]);

        return back()->with('success', 'Отдел деактивирован.');
    }
}
