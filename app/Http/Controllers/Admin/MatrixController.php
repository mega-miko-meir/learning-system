<?php

namespace App\Http\Controllers\Admin;

use App\Exports\MatrixExport;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Document;
use App\Models\Position;
use App\Models\TrainingAssignment;
use App\Models\TrainingMatrix;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class MatrixController extends Controller
{
    public function index()
    {
        $matrix = TrainingMatrix::active()
            ->with(['position.department', 'document'])
            ->orderBy('position_id')
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'position_id' => $m->position_id,
                'document_id' => $m->document_id,
                'position' => $m->position->name,
                'department' => $m->position->department?->name,
                'department_id' => $m->position->department?->id,
                'document_code' => $m->document->title,
                'document' => $m->document->display_name,
                'training_type' => $m->training_type,
                'is_mandatory' => $m->is_mandatory,
                'required_reading_minutes' => $m->required_reading_minutes,
                'created_at' => $m->created_at?->format('d.m.Y H:i'),
            ]);

        $departments = Department::active()->orderBy('name')->get(['id', 'name']);
        $positions = Position::active()->with('department')->orderBy('name')->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'department_id' => $p->department_id,
                'department' => $p->department?->name,
            ]);
        $documents = Document::active()->orderedByName()->get(['id', 'title', 'description']);

        // Для необязательного переключателя «Моя вертикаль» (admin, у которого есть подчинённые):
        // должности, которые реально занимают его подчинённые — по ним фильтруются строки матрицы.
        $myVerticalPositionIds = User::whereIn('id', auth()->user()->subordinateIds())
            ->whereNotNull('position_id')
            ->distinct()
            ->pluck('position_id');

        return Inertia::render('Admin/Matrix/Index', compact(
            'matrix', 'positions', 'documents', 'departments', 'myVerticalPositionIds'
        ));
    }

    // Экспорт с учётом тех же фильтров/поиска, что применены на странице (там они клиентские,
    // поэтому фронт передаёт их сюда параметрами запроса при клике на кнопку выгрузки).
    public function export(Request $request)
    {
        $departmentId = $request->integer('department_id') ?: null;
        $positionId = $request->integer('position_id') ?: null;
        $search = $request->input('search');

        $rows = TrainingMatrix::active()
            ->with(['position.department', 'document'])
            ->when($departmentId, fn ($q) => $q->whereHas('position', fn ($q) => $q->where('department_id', $departmentId)))
            ->when($positionId, fn ($q) => $q->where('position_id', $positionId))
            ->orderBy('position_id')
            ->get()
            ->filter(function ($m) use ($search) {
                if (! $search) {
                    return true;
                }
                $needle = mb_strtolower($search);
                foreach ([$m->position->name, $m->position->department?->name, $m->document->display_name, $m->document->title] as $haystack) {
                    if ($haystack && str_contains(mb_strtolower($haystack), $needle)) {
                        return true;
                    }
                }

                return false;
            })
            ->values();

        $filename = 'training_matrix_'.now()->format('Ymd_His').'.xlsx';

        return Excel::download(new MatrixExport($rows), $filename);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'position_ids' => ['required', 'array', 'min:1'],
            'position_ids.*' => ['exists:positions,id'],
            'document_ids' => ['required', 'array', 'min:1'],
            'document_ids.*' => ['exists:documents,id'],
            'training_type' => ['required', Rule::in(['primary', 'periodic', 'unplanned', 'special'])],
            'is_mandatory' => ['boolean'],
            'required_reading_minutes' => ['required', 'integer', 'min:1', 'max:9999'],
        ]);

        $created = 0;
        $skipped = 0;
        foreach ($data['position_ids'] as $positionId) {
            foreach ($data['document_ids'] as $documentId) {
                $exists = TrainingMatrix::where('position_id', $positionId)
                    ->where('document_id', $documentId)
                    ->where('is_active', true)
                    ->exists();

                if ($exists) {
                    $skipped++;

                    continue;
                }

                TrainingMatrix::create([
                    'position_id' => $positionId,
                    'document_id' => $documentId,
                    'training_type' => $data['training_type'],
                    'is_mandatory' => $data['is_mandatory'] ?? false,
                    'required_reading_minutes' => $data['required_reading_minutes'],
                    'is_active' => true,
                ]);
                $created++;
            }
        }

        if ($created > 0) {
            AuditLog::log(
                'create',
                'TrainingMatrix',
                null,
                "Добавлено в матрицу обучения: {$created} записей (должностей: ".count($data['position_ids']).', документов: '.count($data['document_ids']).')'
            );
        }

        $message = "Добавлено в матрицу: {$created} записей.";
        if ($skipped > 0) {
            $message .= " Пропущено дублей: {$skipped}.";
        }

        return back()->with('success', $message);
    }

    public function update(Request $request, TrainingMatrix $matrix)
    {
        $data = $request->validate([
            'training_type' => ['sometimes', 'required', Rule::in(['primary', 'periodic', 'unplanned', 'special'])],
            'is_mandatory' => ['boolean'],
            'required_reading_minutes' => ['sometimes', 'required', 'integer', 'min:1', 'max:9999'],
        ]);

        $matrix->load('position', 'document');
        $label = "{$matrix->position->name} — {$matrix->document->display_name}";
        $oldValues = $matrix->only(array_keys($data));

        $matrix->update($data);

        $updated = TrainingAssignment::where('matrix_id', $matrix->id)
            ->whereIn('status', ['pending', 'in_progress'])
            ->update(['required_reading_minutes' => $data['required_reading_minutes']]);

        AuditLog::log(
            'update',
            'TrainingMatrix',
            $matrix->id,
            "Изменена запись матрицы обучения: {$label}".($updated > 0 ? " (обновлено активных назначений: {$updated})" : ''),
            $oldValues,
            $data
        );

        $message = 'Запись матрицы обновлена.';
        if ($updated > 0) {
            $message .= " Обновлено активных назначений: {$updated}.";
        }

        return back()->with('success', $message);
    }

    public function destroy(TrainingMatrix $matrix)
    {
        $matrix->load('position', 'document');
        $label = "{$matrix->position->name} — {$matrix->document->display_name}";

        $matrix->update(['is_active' => false]);

        AuditLog::log('deactivate', 'TrainingMatrix', $matrix->id, "Удалена запись из матрицы обучения: {$label}");

        return back()->with('success', 'Запись удалена из матрицы.');
    }

    // Применить матрицу ко всем текущим активным сотрудникам
    public function applyToAll()
    {
        $matrix = TrainingMatrix::active()->with('position')->get();
        $created = 0;

        foreach ($matrix as $item) {
            $users = User::active()
                ->whereIn('role', ['employee', 'manager'])
                ->where('position_id', $item->position_id)
                ->get();

            foreach ($users as $user) {
                $exists = TrainingAssignment::where('user_id', $user->id)
                    ->where('document_id', $item->document_id)
                    ->whereNotIn('status', ['expired'])
                    ->exists();

                if (! $exists) {
                    TrainingAssignment::create([
                        'user_id' => $user->id,
                        'document_id' => $item->document_id,
                        'matrix_id' => $item->id,
                        'training_type' => $item->training_type,
                        'status' => 'pending',
                        'due_date' => now()->addDays(30),
                        'required_reading_minutes' => $item->required_reading_minutes,
                    ]);
                    $created++;
                }
            }
        }

        if ($created > 0) {
            AuditLog::log('create', 'TrainingAssignment', null, "Матрица применена ко всем сотрудникам: создано назначений {$created}");
        }

        return back()->with('success', "Матрица применена. Создано назначений: {$created}.");
    }
}
