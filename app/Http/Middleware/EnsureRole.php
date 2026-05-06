<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Проверяет что текущий пользователь имеет одну из указанных ролей.
     * Использование в роутах: middleware('role:admin,manager')
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user || !$user->is_active) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Доступ запрещён.'], 403);
            }
            return redirect()->route('login');
        }

        // Суперадмин имеет доступ ко всем ролевым маршрутам
        $isSuperAdmin = $user->role === 'superadmin';

        if (!$isSuperAdmin && !in_array($user->role, $roles)) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Недостаточно прав.'], 403);
            }
            abort(403, 'Недостаточно прав для доступа к этой странице.');
        }

        return $next($request);
    }
}
