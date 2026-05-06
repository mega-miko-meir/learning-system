<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $isSuperAdmin = auth()->user()->role === 'superadmin';

        // Если текущий пользователь — admin (не superadmin), скрываем действия superadmin-ов
        $superadminIds = $isSuperAdmin
            ? []
            : User::where('role', 'superadmin')->pluck('id')->toArray();

        $logs = AuditLog::when(!$isSuperAdmin && count($superadminIds),
                fn($q) => $q->whereNotIn('user_id', $superadminIds)
            )
            ->when($request->user_id, fn($q, $id) => $q->where('user_id', $id))
            ->when($request->action, fn($q, $a) => $q->where('action', $a))
            ->when($request->date_from, fn($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->date_to, fn($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()
            ->paginate(50)
            ->withQueryString()
            ->through(fn($l) => [
                'id'          => $l->id,
                'user'        => $l->user_name,
                'action'      => $l->action,
                'model_type'  => $l->model_type,
                'description' => $l->description,
                'ip_address'  => $l->ip_address,
                'created_at'  => $l->created_at->format('d.m.Y H:i:s'),
            ]);

        // В фильтре пользователей admin не видит superadmin-ов
        $users = User::when(!$isSuperAdmin, fn($q) => $q->where('role', '!=', 'superadmin'))
            ->orderBy('last_name')
            ->get(['id', 'last_name', 'first_name']);

        return Inertia::render('Admin/Audit/Index', compact('logs', 'users'));
    }
}
