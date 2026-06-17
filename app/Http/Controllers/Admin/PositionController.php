<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Position;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PositionController extends Controller
{
    public function index()
    {
        $positions = Position::with('department')
            ->orderBy('name')
            ->get()
            ->map(fn($p) => [
                'id'            => $p->id,
                'name'          => $p->name,
                'department'    => $p->department?->name,
                'department_id' => $p->department_id,
                'is_active'     => $p->is_active,
            ]);

        $departments = Department::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Positions/Index', compact('positions', 'departments'));
    }

    public function create()
    {
        $departments = Department::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Positions/Form', ['position' => null, 'departments' => $departments]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:150'],
            'department_id' => ['required', 'exists:departments,id'],
        ]);

        Position::create([...$data, 'is_active' => true]);

        return redirect()->route('admin.positions.index')->with('success', 'Должность создана.');
    }

    public function show(Position $position)
    {
        $position->load('department');

        return Inertia::render('Admin/Positions/Show', compact('position'));
    }

    public function edit(Position $position)
    {
        $departments = Department::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Positions/Form', compact('position', 'departments'));
    }

    public function update(Request $request, Position $position)
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:150', Rule::unique('positions', 'name')->where('department_id', $request->department_id)->ignore($position->id)],
            'department_id' => ['required', 'exists:departments,id'],
            'is_active'     => ['boolean'],
        ]);

        $position->update($data);

        return redirect()->route('admin.positions.index')->with('success', 'Должность обновлена.');
    }

    public function destroy(Position $position)
    {
        $position->update(['is_active' => false]);

        return back()->with('success', 'Должность деактивирована.');
    }
}
