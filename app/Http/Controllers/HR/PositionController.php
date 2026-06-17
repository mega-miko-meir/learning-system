<?php

namespace App\Http\Controllers\HR;

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
            ->active()
            ->orderBy('name')
            ->get()
            ->map(fn($p) => [
                'id'         => $p->id,
                'name'       => $p->name,
                'department' => $p->department?->name,
            ]);

        return Inertia::render('HR/Positions/Index', compact('positions'));
    }

    public function create()
    {
        $departments = Department::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/Positions/Form', ['position' => null, 'departments' => $departments]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:150'],
            'department_id' => ['required', 'exists:departments,id'],
        ]);

        Position::create([...$data, 'is_active' => true]);

        return redirect()->route('hr.positions.index')->with('success', 'Должность создана.');
    }

    public function edit(Position $position)
    {
        $departments = Department::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('HR/Positions/Form', [
            'position' => [
                'id'            => $position->id,
                'name'          => $position->name,
                'department_id' => $position->department_id,
                'is_active'     => $position->is_active,
            ],
            'departments' => $departments,
        ]);
    }

    public function update(Request $request, Position $position)
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:150', Rule::unique('positions', 'name')->where('department_id', $request->department_id)->ignore($position->id)],
            'department_id' => ['required', 'exists:departments,id'],
            'is_active'     => ['boolean'],
        ]);

        $position->update($data);

        return redirect()->route('hr.positions.index')->with('success', 'Должность обновлена.');
    }
}
