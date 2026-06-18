<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\AccountCreated;
use App\Mail\NewEmployeeInduction;
use App\Mail\NewTrainingAssigned;
use App\Mail\PasswordResetNotification;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Document;
use App\Models\Position;
use App\Models\TrainingAssignment;
use App\Models\TrainingMatrix;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with(['department', 'position', 'manager'])
            ->where('role', '!=', 'superadmin')
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('last_name', 'like', "%$s%")
                      ->orWhere('first_name', 'like', "%$s%")
                      ->orWhere('phone', 'like', "%$s%")
                      ->orWhere('email', 'like', "%$s%")
                )
            )
            ->when($request->department_id, fn($q, $d) => $q->where('department_id', $d))
            ->when($request->role, fn($q, $r) => $q->where('role', $r))
            ->when($request->status === 'inactive', fn($q) => $q->where('is_active', false))
            ->when($request->status !== 'inactive' && $request->status !== 'all', fn($q) => $q->active())
            ->orderBy('last_name')
            ->paginate(20)
            ->withQueryString()
            ->through(fn($u) => [
                'id'         => $u->id,
                'full_name'  => $u->full_name,
                'short_name' => $u->short_name,
                'role'       => $u->role,
                'phone'      => $u->phone,
                'email'      => $u->email,
                'department' => $u->department?->name,
                'position'   => $u->position?->name,
                'is_active'  => $u->is_active,
                'hired_at'   => $u->hired_at?->format('d.m.Y'),
                'fired_at'   => $u->fired_at?->format('d.m.Y'),
            ]);

        $departments = Department::active()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Users/Index', compact('users', 'departments'));
    }

    public function create()
    {
        return Inertia::render('Admin/Users/Form', [
            'departments' => Department::active()->with('positions')->orderBy('name')->get(),
            'managers'    => User::active()->whereIn('role', ['manager', 'admin'])->orderBy('last_name')->get(['id', 'last_name', 'first_name', 'middle_name']),
            'user'        => null,
        ]);
    }

    public function store(Request $request)
    {
        $isEmployee = $request->role === 'employee';

        $data = $request->validate([
            'last_name'     => ['required', 'string', 'max:100'],
            'first_name'    => ['required', 'string', 'max:100'],
            'middle_name'   => ['nullable', 'string', 'max:100'],
            'role'          => ['required', Rule::in(['admin', 'hr_admin', 'manager', 'employee'])],
            'phone'         => array_filter(['nullable', 'string', 'max:20', 'unique:users,phone', $isEmployee ? 'required_without:email' : null]),
            'email'         => array_filter(['nullable', 'email', 'unique:users,email', $isEmployee ? 'required_without:phone' : 'required']),
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id'   => ['nullable', 'exists:positions,id'],
            'manager_id'    => ['nullable', 'exists:users,id'],
            'hired_at'      => ['nullable', 'date'],
        ], [
            'phone.required_without' => 'Укажите телефон или email.',
            'email.required_without' => 'Укажите email или телефон.',
        ]);

        $tempPassword = 'Temp' . rand(1000, 9999) . '!';
        $mustChange   = $request->boolean('must_change_password', true);

        $user = User::create([
            ...$data,
            'password'             => Hash::make($tempPassword),
            'must_change_password' => $mustChange,
            'is_active'            => true,
        ]);

        if ($user->position_id) {
            $this->assignTrainingByPosition($user);
        }

        AuditLog::create([
            'user_id'    => auth()->id(),
            'user_name'  => auth()->user()->full_name,
            'action'     => 'create',
            'model_type' => 'User',
            'model_id'   => $user->id,
            'new_values' => $data,
            'ip_address' => $request->ip(),
            'description'=> "Создан сотрудник: {$user->full_name}",
            'created_at' => now(),
        ]);

        $emailSent = false;
        if ($user->email) {
            try {
                $user->load(['department', 'position']);
                Mail::to($user->email)->send(new AccountCreated($user, $tempPassword));
                $emailSent = true;
            } catch (\Exception $e) {
                Log::error('AccountCreated mail failed: ' . $e->getMessage());
            }
        }

        $successMsg = 'Сотрудник успешно создан.';
        if ($emailSent) {
            $successMsg .= ' Письмо с данными для входа отправлено на ' . $user->email . '.';
        } elseif (!$user->email) {
            $successMsg .= ' Email не указан — письмо не отправлено.';
        }

        return redirect()->route('admin.users.show', $user)
            ->with('success', $successMsg)
            ->with('temp_password', $tempPassword);
    }

    public function show(User $user)
    {
        $user->load(['department', 'position', 'manager']);

        $assignments = TrainingAssignment::with([
                'document',
                'testAttempts.attemptAnswers.question',
                'testAttempts.attemptAnswers.answer',
            ])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn($a) => [
                'id'           => $a->id,
                'document'     => $a->document->display_name,
                'type'         => $a->training_type,
                'status'       => $a->status,
                'due_date'     => $a->due_date?->format('d.m.Y'),
                'completed_at' => $a->completed_at?->format('d.m.Y'),
                'best_score'   => $a->testAttempts->max('score_percentage'),
                'attempts'     => $a->testAttempts->map(fn($att) => [
                    'id'             => $att->id,
                    'attempt_number' => $att->attempt_number,
                    'score'          => $att->score_percentage,
                    'passed'         => $att->is_passed,
                    'finished_at'    => $att->finished_at?->format('d.m.Y H:i'),
                    'answers'        => $att->attemptAnswers
                        ->groupBy('question_id')
                        ->map(fn($group) => [
                            'question'   => $group->first()->question?->question_text,
                            'chosen'     => $group->map(fn($aa) => $aa->answer?->answer_text)->filter()->implode(', '),
                            'is_correct' => (bool) $group->first()->is_correct,
                        ])
                        ->values(),
                ])->sortBy('attempt_number')->values(),
            ]);

        return Inertia::render('Admin/Users/Show', [
            'employee'    => [
                'id'         => $user->id,
                'full_name'  => $user->full_name,
                'role'       => $user->role,
                'phone'      => $user->phone,
                'email'      => $user->email,
                'department' => $user->department?->name,
                'position'   => $user->position?->name,
                'manager'    => $user->manager?->short_name,
                'is_active'  => $user->is_active,
                'hired_at'   => $user->hired_at?->format('d.m.Y'),
                'fired_at'   => $user->fired_at?->format('d.m.Y'),
            ],
            'assignments' => $assignments,
            'documents'   => $this->positionDocuments($user),
        ]);
    }

    public function storeAssignment(Request $request, User $user)
    {
        $data = $request->validate([
            'document_ids'    => ['required', 'array', 'min:1'],
            'document_ids.*'  => ['exists:documents,id'],
            'training_type'   => ['required', 'in:primary,periodic,unplanned,special'],
            'reading_minutes' => ['required', 'integer', 'in:5,10,15,20,30,45,60'],
        ]);

        // Первичный инструктаж всегда проводится день в день с оформлением.
        $dueDate = $data['training_type'] === 'primary' ? now() : now()->addDays(30);

        $created = [];
        $skipped = 0;

        foreach ($data['document_ids'] as $documentId) {
            $exists = TrainingAssignment::where('user_id', $user->id)
                ->where('document_id', $documentId)
                ->whereNotIn('status', ['completed', 'failed', 'expired'])
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            $assignment = TrainingAssignment::create([
                'user_id'                  => $user->id,
                'document_id'              => $documentId,
                'training_type'            => $data['training_type'],
                'status'                   => 'pending',
                'due_date'                 => $dueDate,
                'required_reading_minutes' => $data['reading_minutes'],
            ]);

            $assignment->load('document', 'user');

            if ($user->email) {
                try {
                    Mail::to($user->email)->queue(new NewTrainingAssigned($assignment));
                } catch (\Exception $e) {
                    Log::error('Failed to send assignment email: ' . $e->getMessage());
                }
            }

            $created[] = $assignment;
        }

        if (empty($created)) {
            return back()->with('info', 'У сотрудника уже есть активные назначения по всем выбранным документам.');
        }

        if ($data['training_type'] === 'primary') {
            $this->notifyOokAboutNewEmployee($user, $created[0]);
        }

        AuditLog::create([
            'user_id'    => auth()->id(),
            'user_name'  => auth()->user()->full_name,
            'action'     => 'create',
            'model_type' => 'TrainingAssignment',
            'model_id'   => $created[0]->id,
            'new_values' => $data,
            'ip_address' => $request->ip(),
            'description'=> count($created) === 1
                ? "Назначено обучение «{$created[0]->document->display_name}» сотруднику {$user->full_name}"
                : 'Назначено обучение (' . count($created) . " документов) сотруднику {$user->full_name}",
            'created_at' => now(),
        ]);

        $message = 'Назначено документов: ' . count($created) . '.';
        if ($skipped > 0) {
            $message .= " Пропущено (уже назначено): {$skipped}.";
        }

        return back()->with('success', $message);
    }

    private function notifyOokAboutNewEmployee(User $user, TrainingAssignment $assignment): void
    {
        $ook = Department::where('short_name', 'ООК')->first();
        if (!$ook) {
            return;
        }

        $recipients = User::active()
            ->where('department_id', $ook->id)
            ->whereIn('role', ['manager', 'admin'])
            ->get();

        if ($ook->manager && !$recipients->contains('id', $ook->manager->id)) {
            $recipients->push($ook->manager);
        }

        foreach ($recipients as $recipient) {
            if (!$recipient->email) {
                continue;
            }

            try {
                Mail::to($recipient->email)->queue(new NewEmployeeInduction($user, $assignment));
            } catch (\Exception $e) {
                Log::error('Failed to notify OOK manager about new employee: ' . $e->getMessage());
            }
        }
    }

    public function edit(User $user)
    {
        return Inertia::render('Admin/Users/Form', [
            'departments' => Department::active()->with('positions')->orderBy('name')->get(),
            'managers'    => User::active()->whereIn('role', ['manager', 'admin'])->orderBy('last_name')->get(['id', 'last_name', 'first_name', 'middle_name']),
            'user'        => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        $isEmployee = $user->role === 'employee';

        $data = $request->validate([
            'last_name'     => ['required', 'string', 'max:100'],
            'first_name'    => ['required', 'string', 'max:100'],
            'middle_name'   => ['nullable', 'string', 'max:100'],
            'phone'         => array_filter(['nullable', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id), $isEmployee ? 'required_without:email' : null]),
            'email'         => array_filter(['nullable', 'email', Rule::unique('users', 'email')->ignore($user->id), $isEmployee ? 'required_without:phone' : 'required']),
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id'   => ['nullable', 'exists:positions,id'],
            'manager_id'    => ['nullable', 'exists:users,id'],
            'hired_at'      => ['nullable', 'date'],
        ], [
            'phone.required_without' => 'Укажите телефон или email.',
            'email.required_without' => 'Укажите email или телефон.',
        ]);

        $oldPositionId = $user->position_id;
        $oldValues     = $user->only(array_keys($data));

        $user->update($data);

        if (isset($data['position_id']) && (string) $data['position_id'] !== (string) $oldPositionId && $user->position_id) {
            $this->assignTrainingByPosition($user->fresh());
        }

        AuditLog::create([
            'user_id'    => auth()->id(),
            'user_name'  => auth()->user()->full_name,
            'action'     => 'update',
            'model_type' => 'User',
            'model_id'   => $user->id,
            'old_values' => $oldValues,
            'new_values' => $data,
            'ip_address' => $request->ip(),
            'description'=> "Обновлён сотрудник: {$user->full_name}",
            'created_at' => now(),
        ]);

        return redirect()->route('admin.users.show', $user)->with('success', 'Данные обновлены.');
    }

    public function deactivate(Request $request, User $user)
    {
        $request->validate(['fired_at' => ['nullable', 'date']]);

        $user->update([
            'is_active' => false,
            'fired_at'  => $request->fired_at ?? now()->toDateString(),
        ]);

        AuditLog::create([
            'user_id'    => auth()->id(),
            'user_name'  => auth()->user()->full_name,
            'action'     => 'deactivate',
            'model_type' => 'User',
            'model_id'   => $user->id,
            'ip_address' => $request->ip(),
            'description'=> "Деактивирован сотрудник: {$user->full_name}",
            'created_at' => now(),
        ]);

        return back()->with('success', "Сотрудник {$user->short_name} деактивирован.");
    }

    public function activate(Request $request, User $user)
    {
        $user->update(['is_active' => true, 'fired_at' => null]);

        AuditLog::create([
            'user_id'    => auth()->id(),
            'user_name'  => auth()->user()->full_name,
            'action'     => 'activate',
            'model_type' => 'User',
            'model_id'   => $user->id,
            'ip_address' => $request->ip(),
            'description'=> "Активирован сотрудник: {$user->full_name}",
            'created_at' => now(),
        ]);

        return back()->with('success', "Сотрудник {$user->short_name} активирован.");
    }

    public function resetPassword(Request $request, User $user)
    {
        $tempPassword = 'Temp' . rand(1000, 9999) . '!';
        $mustChange   = $request->boolean('must_change_password', true);

        $user->update([
            'password'             => Hash::make($tempPassword),
            'must_change_password' => $mustChange,
        ]);

        AuditLog::create([
            'user_id'    => auth()->id(),
            'user_name'  => auth()->user()->full_name,
            'action'     => 'reset_password',
            'model_type' => 'User',
            'model_id'   => $user->id,
            'ip_address' => $request->ip(),
            'description'=> "Сброшен пароль для: {$user->full_name}",
            'created_at' => now(),
        ]);

        $emailSent = false;
        if ($user->email) {
            try {
                Mail::to($user->email)->send(new PasswordResetNotification($user, $tempPassword));
                $emailSent = true;
            } catch (\Exception $e) {
                Log::error('PasswordReset mail failed: ' . $e->getMessage());
            }
        }

        $successMsg = 'Пароль сброшен.';
        if ($emailSent) {
            $successMsg .= ' Письмо с новым паролем отправлено на ' . $user->email . '.';
        } elseif (!$user->email) {
            $successMsg .= ' Email не указан — письмо не отправлено.';
        }

        return back()
            ->with('success', $successMsg)
            ->with('temp_password', $tempPassword);
    }

    public function assignTraining(User $user)
    {
        if (!$user->position_id) {
            return back()->with('info', 'У сотрудника не указана должность — назначение невозможно.');
        }

        $created = $this->assignTrainingByPosition($user);

        $message = $created > 0
            ? "Назначено новых обучений: {$created}."
            : 'Все обучения по матрице уже назначены.';

        return back()->with('success', $message);
    }

    // ─── Helpers ─────────────────────────────────────────────

    private function positionDocuments(User $user)
    {
        if (!$user->position_id) {
            return collect();
        }

        return Document::active()
            ->whereIn('id', TrainingMatrix::active()->where('position_id', $user->position_id)->pluck('document_id'))
            ->orderBy('description')
            ->get(['id', 'title', 'description']);
    }

    private function assignTrainingByPosition(User $user): int
    {
        $matrixItems = TrainingMatrix::active()
            ->where('position_id', $user->position_id)
            ->get();

        $created = 0;

        foreach ($matrixItems as $item) {
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

        return $created;
    }
}
