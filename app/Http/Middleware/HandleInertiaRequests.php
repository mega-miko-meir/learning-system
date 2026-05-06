<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id'                   => $request->user()->id,
                    'full_name'            => $request->user()->full_name,
                    'short_name'           => $request->user()->short_name,
                    'role'                 => $request->user()->role,
                    'email'                => $request->user()->email,
                    'phone'                => $request->user()->phone,
                    'department'           => $request->user()->department?->name,
                    'must_change_password' => $request->user()->must_change_password,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'info'    => fn () => $request->session()->get('info'),
            ],
        ]);
    }
}
