<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Position;
use App\Models\TrainingAssignment;
use App\Models\TrainingMatrix;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::with(['department', 'position', 'manager'])
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
            ->when($request->status === 'active', fn($q) => $q->active())
            ->when($request->status === 'inactive', fn($q) => $q->where('is_active', false))
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
        $data = $request->validate([
            'last_name'     => ['required', 'string', 'max:100'],
            'first_name'    => ['required', 'string', 'max:100'],
            'middle_name'   => ['nullable', 'string', 'max:100'],
            'role'          => ['required', Rule::in(['admin', 'hr_admin', 'manager', 'employee'])],
            'phone'         => ['required_if:role,employee', 'nullable', 'string', 'max:20', 'unique:users,phone'],
            'email'         => ['required_unless:role,employee', 'nullable', 'email', 'unique:users,email'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id'   => ['nullable', 'exists:positions,id'],
            'manager_id'    => ['nullable', 'exists:users,id'],
            'hired_at'      => ['nullable', 'date'],
        ]);

        $tempPassword = 'Temp' . rand(1000, 9999) . '!';

        $user = User::create([
            ...$data,
            'password'             => Hash::make($tempPassword),
            'must_change_password' => true,
            'is_active'            => true,
        ]);

        // Автоматически назначаем обучение по матрице должности
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

        return redirect()->route('admin.users.show', $user)
            ->with('success', "Сотрудник создан. Временный пароль: {$tempPassword}");
    }

    public function show(User $user)
    {
        $user->load(['department', 'position', 'manager']);

        $assignments = TrainingAssignment::with(['document', 'testAttempts'])
            ->where('user_id', $user->id)
            ->latest()
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'document'      => $a->document->title,
                'type'          => $a->training_type,
                'status'        => $a->status,
                'due_date'      => $a->due_date?->format('d.m.Y'),
                'completed_at'  => $a->completed_at?->format('d.m.Y'),
                'attempts'      => $a->testAttempts->count(),
                'best_score'    => $a->testAttempts->max('score_percentage'),
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
        ]);
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
        $data = $request->validate([
            'last_name'     => ['required', 'string', 'max:100'],
            'first_name'    => ['required', 'string', 'max:100'],
            'middle_name'   => ['nullable', 'string', 'max:100'],
            'phone'         => ['nullable', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id)],
            'email'         => ['nullable', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id'   => ['nullable', 'exists:positions,id'],
            'manager_id'    => ['nullable', 'exists:users,id'],
            'hired_at'      => ['nullable', 'date'],
        ]);

        $oldPosition = $user->position_id;
        $oldValues   = $user->only(array_keys($data));

        $user->update($data);

        // Если сменилась должность — назначаем новое обучение
        if ($oldPosition !== $user->position_id && $user->position_id) {
            $this->assignTrainingByPosition($user);
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

        $user->update([
            'password'             => Hash::make($tempPassword),
            'must_change_password' => true,
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

        return back()->with('success', "Новый временный пароль: {$tempPassword}");
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

    private function assignTrainingByPosition(User $user): int
    {
        $matrixItems = TrainingMatrix::active()
            ->where('position_id', $user->position_id)
            ->get();

        $created = 0;

        foreach ($matrixItems as $item) {
            $exists = TrainingAssignment::where('user_id', $user->id)
                ->where('document_id', $item->document_id)
                ->whereNotIn('status', ['completed', 'failed', 'expired'])
                ->exists();

            if (!$exists) {
                TrainingAssignment::create([
                    'user_id'                  => $user->id,
                    'document_id'              => $item->document_id,
                    'matrix_id'                => $item->id,
                    'training_type'            => $item->training_type,
                    'status'                   => 'pending',
                    'due_date'                 => now()->addDays(30),
                    'required_reading_minutes' => 10,
                ]);
                $created++;
            }
        }

        return $created;
    }
}
