import { Head, Link, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

const ROLES = [
    { value: "superadmin", label: "Системный администратор", cls: "bg-purple-50 text-purple-700 border-purple-200" },
    { value: "admin",      label: "Администратор",            cls: "bg-blue-50 text-blue-700 border-blue-200" },
    { value: "hr_admin",   label: "HR-администратор",         cls: "bg-teal-50 text-teal-700 border-teal-200" },
    { value: "manager",    label: "Руководитель",             cls: "bg-orange-50 text-orange-700 border-orange-200" },
    { value: "employee",   label: "Сотрудник",               cls: "bg-gray-50 text-gray-600 border-gray-200" },
];

function RoleSelector({ user }) {
    const { data, setData, post, processing } = useForm({ role: user.role });
    const [open, setOpen] = useState(false);

    function changeRole(newRole) {
        setData("role", newRole);
        setOpen(false);
        post(route("superadmin.users.role", user.id), {
            data: { role: newRole },
            preserveScroll: true,
        });
    }

    function toggleActive() {
        router.post(route("superadmin.users.toggle", user.id), {}, { preserveScroll: true });
    }

    const currentRole = ROLES.find((r) => r.value === data.role);

    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <button
                    onClick={() => setOpen(!open)}
                    disabled={processing}
                    className={`text-xs px-2.5 py-1 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${currentRole?.cls ?? "bg-gray-50 text-gray-600 border-gray-200"}`}
                >
                    {currentRole?.label ?? data.role} ▾
                </button>
                {open && (
                    <div className="absolute z-20 top-7 left-0 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden w-52">
                        {ROLES.map((r) => (
                            <button
                                key={r.value}
                                onClick={() => changeRole(r.value)}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 ${r.value === data.role ? "font-bold" : ""}`}
                            >
                                <span className={`inline-block w-2 h-2 rounded-full ${r.cls.split(" ")[0]}`} />
                                {r.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button
                onClick={toggleActive}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    user.is_active
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                        : "bg-red-50 text-red-600 border-red-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200"
                }`}
                title={user.is_active ? "Деактивировать" : "Активировать"}
            >
                {user.is_active ? "Активен" : "Неактивен"}
            </button>
        </div>
    );
}

export default function SuperAdminUsersIndex({ users }) {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    const [search, setSearch] = useState(params.search ?? "");

    function filter(key, value) {
        router.get(route("superadmin.users.index"), { ...params, [key]: value || undefined }, {
            preserveState: true, replace: true,
        });
    }

    function doSearch(e) {
        e.preventDefault();
        filter("search", search);
    }

    return (
        <AppLayout title="Управление пользователями">
            <Head title="Пользователи и роли" />

            <div className="flex flex-wrap gap-2 mb-6 items-center">
                <form onSubmit={doSearch} className="flex gap-2">
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск..."
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-48" />
                    <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">Найти</button>
                </form>

                <select value={params.role ?? ""} onChange={(e) => filter("role", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Все роли</option>
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>

                <Link href={route("superadmin.users.create")}
                    className="ml-auto px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                    + Добавить пользователя
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">ФИО</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Email / Телефон</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Отдел</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Роль и статус</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.data.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Пользователей не найдено</td></tr>
                        ) : users.data.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                                <td className="px-4 py-3 text-gray-400 text-xs">
                                    {u.email ?? u.phone ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs">{u.department ?? "—"}</td>
                                <td className="px-4 py-3">
                                    <RoleSelector user={u} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination links={users.links} />
        </AppLayout>
    );
}
