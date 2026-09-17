<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\NewTrainingAssigned;
use App\Models\Department;
use App\Models\Document;
use App\Models\Position;
use App\Models\TestAttempt;
use App\Models\TrainingAssignment;
use App\Models\TrainingMatrix;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class AssignmentController extends Controller
{
    public function index(Request $request)
    {
        $activeOnly = $request->boolean('active_only', true);

        $assignments = TrainingAssignment::with(['user', 'document'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->department_id, fn($q, $d) =>
                $q->whereHas('user', fn($u) => $u->where('department_id', $d))
            )
            ->when($activeOnly, fn($q) => $q->whereHas('user', fn($u) => $u->where('is_active', true)))
            ->latest()
            ->paginate(20)
            ->withQueryString()
            ->through(fn($a) => [
                'id'              => $a->id,
                'user_id'         => $a->user->id,
                'user'            => $a->user->full_name,
                'user_is_active'  => $a->user->is_active,
                'document_id'     => $a->document->id,
                'document'        => $a->document->display_name,
                'type'            => $a->training_type,
                'status'          => $a->status,
                'due_date'        => $a->due_date?->format('d.m.Y'),
                'due_date_raw'    => $a->due_date?->format('Y-m-d'),
                'completed_at'    => $a->completed_at?->format('d.m.Y'),
                'reading_minutes' => $a->required_reading_minutes,
            ]);

        $departments = Department::active()->orderBy('name')->get(['id', 'name']);
        $positions   = Position::active()->with('department')->orderBy('name')
            ->get(['id', 'name', 'department_id']);
        $documents   = Document::active()->orderBy('description')->get(['id', 'title', 'description']);
        $employees   = User::active()
            ->whereIn('role', ['employee', 'hr_admin', 'manager'])
            ->with(['department', 'position'])
            ->orderBy('last_name')
            ->get()
            ->map(fn($u) => [
                'id'            => $u->id,
                'name'          => $u->full_name,
                'position_id'   => $u->position_id,
                'department_id' => $u->department_id,
                'department'    => $u->department?->name,
                'position'      => $u->position?->name,
            ]);

        return Inertia::render('Admin/Assignments/Index', compact(
            'assignments', 'departments', 'positions', 'documents', 'employees'
        ));
    }

    public function assignBulk(Request $request)
    {
        $data = $request->validate([
            'user_ids'         => ['required', 'array', 'min:1'],
            'user_ids.*'       => ['exists:users,id'],
            'document_id'      => ['required', 'exists:documents,id'],
            'training_type'    => ['required', 'in:primary,periodic,unplanned,special'],
            'due_date'         => ['nullable', 'date', 'after:today'],
            'reading_minutes'  => ['required', 'integer', 'in:5,10,15,20,30,45,60'],
        ]);

        $created = 0;
        $skipped = 0;

        foreach ($data['user_ids'] as $userId) {
            $user = User::find($userId);

            $exists = TrainingAssignment::where('user_id', $userId)
                ->where('document_id', $data['document_id'])
                ->whereNotIn('status', ['completed', 'failed', 'expired'])
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            $matrixId = $user->position_id
                ? TrainingMatrix::active()
                    ->where('position_id', $user->position_id)
                    ->where('document_id', $data['document_id'])
                    ->value('id')
                : null;

            $assignment = TrainingAssignment::create([
                'user_id'                  => $userId,
                'document_id'              => $data['document_id'],
                'matrix_id'                => $matrixId,
                'training_type'            => $data['training_type'],
                'status'                   => 'pending',
                'due_date'                 => $data['due_date'] ?? now()->addDays(30),
                'required_reading_minutes' => $data['reading_minutes'],
            ]);

            if ($user?->email) {
                try {
                    Mail::to($user->email)->queue(new NewTrainingAssigned($assignment->load('document', 'user')));
                } catch (\Exception $e) {
                    Log::error('Failed to send assignment email: ' . $e->getMessage());
                }
            }

            $created++;
        }

        $message = "Назначено: {$created} сотрудников.";
        if ($skipped > 0) {
            $message .= " Пропущено (уже есть активное назначение): {$skipped}.";
        }

        return back()->with('success', $message);
    }

    public function update(Request $request, TrainingAssignment $assignment)
    {
        $data = $request->validate([
            'training_type'   => ['required', 'in:primary,periodic,unplanned,special'],
            'due_date'        => ['nullable', 'date'],
            'reading_minutes' => ['required', 'integer', 'in:5,10,15,20,30,45,60'],
        ]);

        $assignment->update([
            'training_type'            => $data['training_type'],
            'due_date'                 => $data['due_date'] ?: null,
            'required_reading_minutes' => $data['reading_minutes'],
        ]);

        return back()->with('success', 'Назначение обновлено.');
    }

    public function reset(TrainingAssignment $assignment)
    {
        // Удаляем все попытки теста — сотрудник начинает с чистого листа
        TestAttempt::where('assignment_id', $assignment->id)->delete();

        $assignment->update([
            'status'              => 'pending',
            'started_at'          => null,
            'completed_at'        => null,
            'time_spent_seconds'  => 0,
        ]);

        return back()->with('success', 'Назначение сброшено. Сотрудник может пройти обучение заново.');
    }

    public function destroy(TrainingAssignment $assignment)
    {
        TestAttempt::where('assignment_id', $assignment->id)->delete();
        $assignment->delete();

        return back()->with('success', 'Назначение удалено.');
    }
}
