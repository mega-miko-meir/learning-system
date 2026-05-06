<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Position;
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
}
