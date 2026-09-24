<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// Закрывает маршруты выключенной функции (config/features.php): для всех — 404, как будто их нет.
class EnsureFeatureEnabled
{
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        abort_unless(config("features.{$feature}"), 404);

        return $next($request);
    }
}
