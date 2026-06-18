<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Position;
use App\Models\TrainingAssignment;
use App\Models\TrainingMatrix;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MatrixController extends Controller
{
    public function index()
    {
        $matrix = TrainingMatrix::active()
            ->with(['position.department', 'document'])
            ->orderBy('position_id')
            ->get()
            ->map(fn($m) => [
                'id'                       => $m->id,
                'position_id'              => $m->position_id,
                'document_id'              => $m->document_id,
                'position'                 => $m->position->name,
                'department'               => $m->position->department?->name,
                'department_id'            => $m->position->department?->id,
                'document'                 => $m->document->display_name,
                'training_type'            => $m->training_type,
                'is_mandatory'             => $m->is_mandatory,
                'required_reading_minutes' => $m->required_reading_minutes,
            ]);

        $departments = \App\Models\Department::active()->orderBy('name')->get(['id', 'name']);
        $positions   = Position::active()->with('department')->orderBy('name')->get(['id', 'name', 'department_id']);
        $documents   = Document::active()->orderBy('description')->get(['id', 'title', 'description']);

        return Inertia::render('Admin/Matrix/Index', compact('matrix', 'positions', 'documents', 'departments'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'position_ids'             => ['required', 'array', 'min:1'],
            'position_ids.*'           => ['exists:positions,id'],
            'document_ids'             => ['required', 'array', 'min:1'],
            'document_ids.*'           => ['exists:documents,id'],
            'training_type'            => ['required', Rule::in(['primary', 'periodic', 'unplanned', 'special'])],
            'is_mandatory'             => ['boolean'],
            'required_reading_minutes' => ['required', 'integer', 'min:1', 'max:9999'],
        ]);

        $created = 0;
        foreach ($data['position_ids'] as $positionId) {
            foreach ($data['document_ids'] as $documentId) {
                TrainingMatrix::create([
                    'position_id'              => $positionId,
                    'document_id'              => $documentId,
                    'training_type'            => $data['training_type'],
                    'is_mandatory'             => $data['is_mandatory'] ?? false,
                    'required_reading_minutes' => $data['required_reading_minutes'],
                    'is_active'                => true,
                ]);
                $created++;
            }
        }

        return back()->with('success', "Добавлено в матрицу: {$created} записей.");
    }

    public function update(Request $request, TrainingMatrix $matrix)
    {
        $data = $request->validate([
            'training_type'            => ['sometimes', 'required', Rule::in(['primary', 'periodic', 'unplanned', 'special'])],
            'is_mandatory'             => ['boolean'],
            'required_reading_minutes' => ['sometimes', 'required', 'integer', 'min:1', 'max:9999'],
        ]);

        $matrix->update($data);

        $updated = TrainingAssignment::where('matrix_id', $matrix->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->update(['required_reading_minutes' => $data['required_reading_minutes']]);

        $message = 'Запись матрицы обновлена.';
        if ($updated > 0) {
            $message .= " Обновлено активных назначений: {$updated}.";
        }

        return back()->with('success', $message);
    }

    public function destroy(TrainingMatrix $matrix)
    {
        $matrix->update(['is_active' => false]);

        return back()->with('success', 'Запись удалена из матрицы.');
    }

    // Применить матрицу ко всем текущим активным сотрудникам
    public function applyToAll()
    {
        $matrix = TrainingMatrix::active()->with('position')->get();
        $created = 0;

        foreach ($matrix as $item) {
            $users = User::active()
                ->where('role', 'employee')
                ->where('position_id', $item->position_id)
                ->get();

            foreach ($users as $user) {
                $exists = TrainingAssignment::where('user_id', $user->id)
                    ->where('document_id', $item->document_id)
                    ->whereNotIn('status', ['expired'])
                    ->exists();

                if (!$exists) {
                    TrainingAssignment::create([
                        'user_id'                  => $user->id,
                        'document_id'              => $item->document_id,
                        'matrix_id'                => $item->id,
                        'training_type'            => $item->training_type,
                        'status'                   => 'pending',
                        'due_date'                 => now()->addDays(30),
                        'required_reading_minutes' => $item->required_reading_minutes,
                    ]);
                    $created++;
                }
            }
        }

        return back()->with('success', "Матрица применена. Создано назначений: {$created}.");
    }
}
