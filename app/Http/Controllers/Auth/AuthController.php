<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    /**
     * Страница логина
     */
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Обработка логина.
     * Определяем тип логина: если введён телефон (начинается с + или цифр) → ищем сотрудника,
     * иначе → ищем по email (admin, hr_admin, manager).
     */
    public function login(Request $request)
    {
        $request->validate([
            'login'    => ['required', 'string'],
            'password' => ['required', 'string'],
        ], [
            'login.required'    => 'Введите логин (телефон или email).',
            'password.required' => 'Введите пароль.',
        ]);

        $login = trim($request->login);
        $isPhone = $this->looksLikePhone($login);

        // Нормализуем номер телефона (убираем пробелы, тире)
        if ($isPhone) {
            $login = $this->normalizePhone($login);
        }

        // Ищем пользователя
        $user = $isPhone
            ? User::where('phone', $login)->where('role', 'employee')->first()
            : User::where('email', $login)->whereIn('role', ['superadmin', 'admin', 'hr_admin', 'manager'])->first();

        // Проверяем пароль
        if (!$user || !Hash::check($request->password, $user->password)) {
            $this->logFailedAttempt($request, $login);
            throw ValidationException::withMessages([
                'login' => 'Неверный логин или пароль.',
            ]);
        }

        // Проверяем активность
        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'login' => 'Ваш аккаунт деактивирован. Обратитесь к администратору.',
            ]);
        }

        // Логиним
        Auth::login($user, $request->boolean('remember'));
        $request->session()->regenerate();

        // Audit log
        AuditLog::create([
            'user_id'    => $user->id,
            'user_name'  => $user->full_name,
            'action'     => 'login',
            'model_type' => 'User',
            'model_id'   => $user->id,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'description' => "Вход в систему ({$user->role})",
            'created_at' => now(),
        ]);

        // Если нужно сменить пароль — редиректим на смену
        if ($user->must_change_password) {
            return redirect()->route('password.change');
        }

        return redirect($this->redirectByRole($user->role));
    }

    /**
     * Выход
     */
    public function logout(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            AuditLog::create([
                'user_id'    => $user->id,
                'user_name'  => $user->full_name,
                'action'     => 'logout',
                'model_type' => 'User',
                'model_id'   => $user->id,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'description' => 'Выход из системы',
                'created_at' => now(),
            ]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    /**
     * Страница смены пароля (при первом входе)
     */
    public function showChangePassword(): Response
    {
        return Inertia::render('Auth/ChangePassword');
    }

    /**
     * Обработка смены пароля
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'regex:/[A-Z]/',      // минимум одна заглавная
                'regex:/[0-9]/',      // минимум одна цифра
            ],
        ], [
            'password.min'     => 'Пароль должен содержать минимум 8 символов.',
            'password.regex'   => 'Пароль должен содержать заглавную букву и цифру.',
            'password.confirmed' => 'Пароли не совпадают.',
        ]);

        $user = $request->user();
        $user->update([
            'password'             => Hash::make($request->password),
            'must_change_password' => false,
        ]);

        AuditLog::create([
            'user_id'    => $user->id,
            'user_name'  => $user->full_name,
            'action'     => 'password_changed',
            'model_type' => 'User',
            'model_id'   => $user->id,
            'ip_address' => $request->ip(),
            'description' => 'Пользователь сменил пароль',
            'created_at' => now(),
        ]);

        return redirect($this->redirectByRole($user->role));
    }

    // ─── Helpers ─────────────────────────────────────────────

    private function looksLikePhone(string $value): bool
    {
        // Телефон: начинается с +, 7, 8, или содержит только цифры/пробелы/тире/скобки
        return (bool) preg_match('/^[\+\d][\d\s\-\(\)]{6,}$/', $value);
    }

    private function normalizePhone(string $phone): string
    {
        // Оставляем только цифры и +
        $clean = preg_replace('/[^\d\+]/', '', $phone);
        // Казахстан: 8... → +7...
        if (str_starts_with($clean, '8') && strlen($clean) === 11) {
            $clean = '+7' . substr($clean, 1);
        }
        // 77... → +77...
        if (str_starts_with($clean, '77') && strlen($clean) === 11) {
            $clean = '+' . $clean;
        }
        return $clean;
    }

    private function redirectByRole(string $role): string
    {
        return match($role) {
            'superadmin' => route('superadmin.dashboard'),
            'admin'      => route('admin.dashboard'),
            'hr_admin'   => route('hr.dashboard'),
            'manager'    => route('manager.dashboard'),
            'employee'   => route('employee.dashboard'),
            default      => route('login'),
        };
    }

    private function logFailedAttempt(Request $request, string $login): void
    {
        AuditLog::create([
            'user_id'    => null,
            'user_name'  => null,
            'action'     => 'login_failed',
            'model_type' => 'User',
            'model_id'   => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'description' => "Неудачная попытка входа: {$login}",
            'new_values' => ['login' => $login],
            'created_at' => now(),
        ]);
    }
}
