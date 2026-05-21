import { Head, router, usePage } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

const ACTION_LABELS = {
    create:         "Создание",
    update:         "Изменение",
    delete:         "Удаление",
    deactivate:     "Деактивация",
    activate:       "Активация",
    reset_password: "Сброс пароля",
    login:          "Вход",
    logout:         "Выход",
    new_version:    "Новая версия",
};

const ACTION_COLORS = {
    create:      "bg-green-50 text-green-700",
    update:      "bg-blue-50 text-blue-700",
    delete:      "bg-red-50 text-red-700",
    deactivate:  "bg-orange-50 text-orange-700",
    new_version: "bg-purple-50 text-purple-700",
};

export default function AuditIndex({ logs, users }) {
    const { auth } = usePage().props;
    const showIp = auth.user?.role === "superadmin";
    const params = Object.fromEntries(new URLSearchParams(window.location.search));

    function filter(key, value) {
        router.get(route("admin.audit.index"), { ...params, [key]: value || undefined }, {
            preserveState: true, replace: true,
        });
    }

    return (
        <AppLayout title="Журнал аудита">
            <Head title="Журнал аудита" />

            {/* Фильтры */}
            <div className="flex flex-wrap gap-2 mb-6">
                <select
                    value={params.user_id ?? ""}
                    onChange={(e) => filter("user_id", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Все пользователи</option>
                    {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.last_name} {u.first_name}</option>
                    ))}
                </select>

                <select
                    value={params.action ?? ""}
                    onChange={(e) => filter("action", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Все действия</option>
                    {Object.entries(ACTION_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                    ))}
                </select>

                <input
                    type="date"
                    value={params.date_from ?? ""}
                    onChange={(e) => filter("date_from", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="self-center text-gray-400 text-sm">—</span>
                <input
                    type="date"
                    value={params.date_to ?? ""}
                    onChange={(e) => filter("date_to", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Время</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Пользователь</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Действие</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Описание</th>
                            {showIp && <th className="text-left px-4 py-3 font-medium text-gray-600">IP</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {logs.data.length === 0 ? (
                            <tr>
                                <td colSpan={showIp ? 5 : 4} className="px-4 py-8 text-center text-gray-400">
                                    Записей нет
                                </td>
                            </tr>
                        ) : (
                            logs.data.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                                        {log.created_at}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{log.user}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            ACTION_COLORS[log.action] ?? "bg-gray-100 text-gray-500"
                                        }`}>
                                            {ACTION_LABELS[log.action] ?? log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                                        {log.description}
                                    </td>
                                    {showIp && <td className="px-4 py-3 text-gray-400 text-xs">{log.ip_address}</td>}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination links={logs.links} />
        </AppLayout>
    );
}
