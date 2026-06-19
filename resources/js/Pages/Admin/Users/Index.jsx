import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

const ROLES = [
    { value: "", label: "Все роли" },
    { value: "admin", label: "Администратор" },
    { value: "hr_admin", label: "HR-администратор" },
    { value: "manager", label: "Руководитель" },
    { value: "employee", label: "Сотрудник" },
];

const ROLE_LABELS = {
    admin:    "Администратор",
    hr_admin: "HR-администратор",
    manager:  "Руководитель",
    employee: "Сотрудник",
};

export default function UsersIndex({ users, departments }) {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    const [search, setSearch] = useState("");

    function filter(key, value) {
        const { search: _omit, ...rest } = params;
        router.get(route("admin.users.index"), { ...rest, [key]: value || undefined }, {
            preserveState: true, replace: true,
        });
    }

    const q = search.trim().toLowerCase();
    const visibleRows = q
        ? users.data.filter((u) =>
            [u.full_name, u.department, u.position, u.email, u.phone]
                .some((v) => v?.toLowerCase().includes(q))
        )
        : users.data;

    return (
        <AppLayout title="Сотрудники">
            <Head title="Сотрудники" />

            {/* Фильтры */}
            <div className="flex flex-wrap gap-2 mb-6 items-center">
                {/* Поиск — фронтенд */}
                <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по имени, отделу..."
                        className="pl-8 pr-7 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                    />
                    {search && (
                        <button onClick={() => setSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                            ×
                        </button>
                    )}
                </div>

                <select
                    value={params.department_id ?? ""}
                    onChange={(e) => filter("department_id", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Все отделы</option>
                    {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>

                <select
                    value={params.role ?? ""}
                    onChange={(e) => filter("role", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                </select>

                <select
                    value={params.status ?? ""}
                    onChange={(e) => filter("status", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Активные</option>
                    <option value="inactive">Неактивные</option>
                    <option value="all">Все сотрудники</option>
                </select>

                {q && (
                    <span className="text-xs text-gray-400">Найдено: {visibleRows.length}</span>
                )}

                <Link
                    href={route("admin.users.create")}
                    className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    + Добавить
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">ФИО</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Роль</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Отдел</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Контакт</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Приём / Увольнение</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {visibleRows.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                                    Сотрудников не найдено
                                </td>
                            </tr>
                        ) : (
                            visibleRows.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-gray-500">
                                            {ROLE_LABELS[u.role] ?? u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500">{u.department ?? "—"}</td>
                                    <td className="px-4 py-3 text-gray-500">{u.position ?? "—"}</td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {u.email ?? u.phone ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {u.is_active
                                            ? <span className="text-gray-400">{u.hired_at ?? "—"}</span>
                                            : <span className="text-red-400">{u.fired_at ?? u.hired_at ?? "—"}</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            u.is_active
                                                ? "bg-green-50 text-green-700"
                                                : "bg-red-50 text-red-600"
                                        }`}>
                                            {u.is_active ? "Активен" : "Неактивен"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={route("admin.users.show", u.id)}
                                            className="text-blue-600 hover:underline text-xs"
                                        >
                                            Открыть
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!q && <Pagination links={users.links} />}
        </AppLayout>
    );
}
