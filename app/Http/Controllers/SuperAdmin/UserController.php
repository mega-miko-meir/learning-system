<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Position;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    private const ROLES = ['superadmin', 'admin', 'hr_admin', 'manager', 'employee'];

    public function index(Request $request)
    {
        $users = User::with(['department', 'position'])
            ->when($request->search, fn($q, $s) =>
                $q->where(fn($q) =>
                    $q->where('last_name', 'like', "%$s%")
                      ->orWhere('first_name', 'like', "%$s%")
                      ->orWhere('email', 'like', "%$s%")
                )
            )
            ->when($request->role, fn($q, $r) => $q->where('role', $r))
            ->orderBy('last_name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn($u) => [
                'id'         => $u->id,
                'full_name'  => $u->full_name,
                'role'       => $u->role,
                'email'      => $u->email,
                'phone'      => $u->phone,
                'department' => $u->department?->name,
                'is_active'  => $u->is_active,
            ]);

        return Inertia::render('SuperAdmin/Users/Index', compact('users'));
    }

    /** Изменить роль пользователя */
    public function changeRole(Request $request, User $user)
    {
        $request->validate([
            'role' => ['required', Rule::in(self::ROLES)],
        ]);

        // Нельзя понизить себя
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Нельзя изменить собственную роль.');
        }

        $oldRole = $user->role;
        $user->update(['role' => $request->role]);

        AuditLog::create([
            'user_id'     => auth()->id(),
            'user_name'   => auth()->user()->full_name,
            'action'      => 'update',
            'model_type'  => 'User',
            'model_id'    => $user->id,
            'old_values'  => ['role' => $oldRole],
            'new_values'  => ['role' => $request->role],
            'ip_address'  => $request->ip(),
            'description' => "Изменена роль пользователя {$user->full_name}: {$oldRole} → {$request->role}",
            'created_at'  => now(),
        ]);

        return back()->with('success', "Роль пользователя {$user->short_name} изменена на «{$request->role}».");
    }

    /** Создать суперадмина / системного пользователя */
    public function create()
    {
        $departments = Department::active()->with('positions')->orderBy('name')->get();
        return Inertia::render('SuperAdmin/Users/Form', [
            'departments' => $departments,
            'roles'       => self::ROLES,
            'user'        => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'last_name'     => ['required', 'string', 'max:100'],
            'first_name'    => ['required', 'string', 'max:100'],
            'middle_name'   => ['nullable', 'string', 'max:100'],
            'role'          => ['required', Rule::in(self::ROLES)],
            'email'         => ['required', 'email', 'unique:users,email'],
            'phone'         => ['nullable', 'string', 'max:20', 'unique:users,phone'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'position_id'   => ['nullable', 'exists:positions,id'],
            'password'      => ['required', 'string', 'min:8'],
        ]);

        $user = User::create([
            ...$data,
            'password'             => Hash::make($data['password']),
            'must_change_password' => false,
            'is_active'            => true,
        ]);

        AuditLog::create([
            'user_id'     => auth()->id(),
            'user_name'   => auth()->user()->full_name,
            'action'      => 'create',
            'model_type'  => 'User',
            'model_id'    => $user->id,
            'ip_address'  => $request->ip(),
            'description' => "Создан системный пользователь: {$user->full_name} ({$user->role})",
            'created_at'  => now(),
        ]);

        return redirect()->route('superadmin.users.index')->with('success', 'Пользователь создан.');
    }

    /** Активировать / деактивировать */
    public function toggleActive(User $user)
    {
        if ($user->id === auth()->id()) {
            return back()->with('error', 'Нельзя деактивировать себя.');
        }

        $user->update(['is_active' => !$user->is_active]);

        AuditLog::create([
            'user_id'     => auth()->id(),
            'user_name'   => auth()->user()->full_name,
            'action'      => $user->is_active ? 'activate' : 'deactivate',
            'model_type'  => 'User',
            'model_id'    => $user->id,
            'ip_address'  => request()->ip(),
            'description' => ($user->is_active ? 'Активирован' : 'Деактивирован') . " пользователь: {$user->full_name}",
            'created_at'  => now(),
        ]);

        return back()->with('success', $user->is_active ? 'Пользователь активирован.' : 'Пользователь деактивирован.');
    }
}
