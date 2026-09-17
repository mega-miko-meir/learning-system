<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Position;
use App\Models\User;
use Illuminate\Http\Request;

// Глобальный поиск (Ctrl+K). Один эндпоинт для всех ролей — область поиска
// и ссылка на результат зависят от роли текущего пользователя.
class SearchController extends Controller
{
    public function index(Request $request)
    {
        $q = trim((string) $request->get('q', ''));

        if (mb_strlen($q) < 2) {
            return response()->json(['employees' => [], 'documents' => [], 'positions' => []]);
        }

        $user = $request->user();

        return response()->json([
            'employees' => $this->searchEmployees($user, $q),
            'documents' => $this->searchDocuments($user, $q),
            'positions' => $this->searchPositions($user, $q),
        ]);
    }

    private function searchEmployees(User $user, string $q): array
    {
        $routeName = match ($user->role) {
            'superadmin', 'admin' => 'admin.users.show',
            'hr_admin'            => 'hr.users.show',
            'manager'             => 'manager.employees.show',
            default               => null,
        };

        if (!$routeName) {
            return [];
        }

        $query = User::query()
            ->with(['department', 'position'])
            ->where(fn($w) => $w
                ->where('last_name', 'like', "%{$q}%")
                ->orWhere('first_name', 'like', "%{$q}%")
                ->orWhere('middle_name', 'like', "%{$q}%")
                ->orWhere('phone', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%")
                ->orWhereHas('position', fn($p) => $p->where('name', 'like', "%{$q}%"))
            );

        match ($user->role) {
            'admin', 'hr_admin' => $query->where('role', '!=', 'superadmin'),
            'manager'           => $query->where('manager_id', $user->id),
            default             => null,
        };

        return $query->orderBy('last_name')->limit(8)->get()->map(fn($u) => [
            'id'       => $u->id,
            'title'    => $u->full_name,
            'subtitle' => trim(($u->position?->name ?? '') . ' · ' . ($u->department?->name ?? ''), ' ·') ?: null,
            'url'      => route($routeName, $u->id),
        ])->values()->all();
    }

    private function searchDocuments(User $user, string $q): array
    {
        // Раздел «Документы» есть только у admin/superadmin — у остальных ролей нет страницы, куда вести.
        if (!in_array($user->role, ['superadmin', 'admin'])) {
            return [];
        }

        return Document::active()
            ->where(fn($w) => $w
                ->where('title', 'like', "%{$q}%")
                ->orWhere('description', 'like', "%{$q}%")
                ->orWhere('type', 'like', "%{$q}%")
            )
            ->orderBy('description')
            ->limit(8)
            ->get(['id', 'title', 'description', 'type'])
            ->map(fn($d) => [
                'id'       => $d->id,
                'title'    => $d->display_name,
                'subtitle' => trim(($d->title !== $d->display_name ? $d->title . ' · ' : '') . $d->type),
                'url'      => route('admin.documents.show', $d->id),
            ])->values()->all();
    }

    private function searchPositions(User $user, string $q): array
    {
        // admin.positions.show не имеет фронтенд-страницы (используется только .edit) — ведём на редактирование.
        $routeName = match ($user->role) {
            'superadmin', 'admin' => 'admin.positions.edit',
            'hr_admin'            => 'hr.positions.edit',
            default               => null,
        };

        if (!$routeName) {
            return [];
        }

        return Position::active()
            ->with('department')
            ->where('name', 'like', "%{$q}%")
            ->orderBy('name')
            ->limit(8)
            ->get()
            ->map(fn($p) => [
                'id'       => $p->id,
                'title'    => $p->name,
                'subtitle' => $p->department?->name,
                'url'      => route($routeName, $p->id),
            ])->values()->all();
    }
}
