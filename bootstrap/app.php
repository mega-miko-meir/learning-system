<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        $middleware->alias([
            'role'        => \App\Http\Middleware\EnsureRole::class,
            'user.active' => \App\Http\Middleware\EnsureUserIsActive::class,
        ]);

        $middleware->redirectUsersTo(function (\Illuminate\Http\Request $request): string {
            $role = $request->user()?->role;
            return match ($role) {
                'superadmin' => route('superadmin.dashboard'),
                'admin'      => route('admin.dashboard'),
                'hr_admin'   => route('hr.dashboard'),
                'manager'    => route('manager.dashboard'),
                'employee'   => route('employee.dashboard'),
                default      => route('login'),
            };
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
