import { Head, Link } from "@inertiajs/react";
import AppLayout from "../../Layouts/AppLayout";

const ROLE_LABELS = {
    superadmin: { label: "Системный администратор", cls: "bg-purple-50 text-purple-700 border-purple-200" },
    admin:      { label: "Администратор",            cls: "bg-blue-50 text-blue-700 border-blue-200" },
    hr_admin:   { label: "HR-администратор",         cls: "bg-teal-50 text-teal-700 border-teal-200" },
    manager:    { label: "Руководитель",             cls: "bg-orange-50 text-orange-700 border-orange-200" },
    employee:   { label: "Сотрудник",               cls: "bg-gray-50 text-gray-700 border-gray-200" },
};

export default function SuperAdminDashboard({ stats, roleStats, recentUsers }) {
    return (
        <AppLayout title="Системная панель">
            <Head title="Системная панель" />

            {/* Общая статистика */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {[
                    { label: "Всего пользователей",    value: stats.total_users,         color: "text-purple-600" },
                    { label: "Активных сотрудников",   value: stats.active_employees,    color: "text-blue-600" },
                    { label: "Документов",              value: stats.total_documents,     color: "text-gray-700" },
                    { label: "Всего назначений",        value: stats.assignments_total,   color: "text-gray-700" },
                    { label: "Выполнено",               value: stats.assignments_done,    color: "text-green-600" },
                    { label: "Просрочено",              value: stats.assignments_overdue, color: "text-red-600" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                        <p className="text-sm text-gray-400 mb-1">{label}</p>
                        <p className={`text-3xl font-bold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Пользователи по ролям */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-700">Пользователи по ролям</h2>
                        <Link href={route("superadmin.users.index")}
                            className="text-xs text-blue-600 hover:underline">
                            Управление →
                        </Link>
                    </div>
                    <div className="space-y-2">
                        {Object.entries(ROLE_LABELS).map(([role, { label, cls }]) => (
                            <div key={role} className="flex items-center justify-between">
                                <span className={`text-xs px-2.5 py-1 rounded-full border ${cls}`}>{label}</span>
                                <span className="text-sm font-semibold text-gray-700">
                                    {roleStats[role] ?? 0}
                                </span>
                            </div>
                        ))}
                    </div>
                    <Link href={route("superadmin.users.create")}
                        className="mt-4 block w-full text-center px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                        + Добавить пользователя
                    </Link>
                </div>

                {/* Последние добавленные пользователи */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Последние пользователи</h2>
                    <ul className="space-y-2">
                        {recentUsers.map((u) => {
                            const r = ROLE_LABELS[u.role] ?? { label: u.role, cls: "bg-gray-50 text-gray-600 border-gray-200" };
                            return (
                                <li key={u.id} className="flex items-center gap-3 text-sm">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold shrink-0">
                                        {u.full_name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{u.full_name}</p>
                                        <p className="text-xs text-gray-400">{u.department ?? "—"}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${r.cls}`}>
                                        {r.label}
                                    </span>
                                    {!u.is_active && (
                                        <span className="text-xs text-red-500 shrink-0">неактивен</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </AppLayout>
    );
}
