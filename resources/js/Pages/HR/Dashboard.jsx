import { Head, Link } from "@inertiajs/react";
import AppLayout from "../../Layouts/AppLayout";

export default function HRDashboard({ stats, recentHires }) {
    return (
        <AppLayout title="HR — Главная">
            <Head title="HR Панель" />

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-sm text-gray-400 mb-1">Активных сотрудников</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.total_employees}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-sm text-gray-400 mb-1">Неактивных</p>
                    <p className="text-3xl font-bold text-gray-400">{stats.total_inactive}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-sm text-gray-400 mb-1">Отделов</p>
                    <p className="text-3xl font-bold text-gray-700">{stats.departments}</p>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Последние принятые сотрудники</h2>
                <Link href={route("hr.users.create")}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    + Добавить сотрудника
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">ФИО</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Отдел</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Принят</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {recentHires.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Нет данных</td></tr>
                        ) : recentHires.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                                <td className="px-4 py-3 text-gray-500">{u.department ?? "—"}</td>
                                <td className="px-4 py-3 text-gray-500">{u.position ?? "—"}</td>
                                <td className="px-4 py-3 text-gray-400">{u.hired_at ?? "—"}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route("hr.users.show", u.id)} className="text-blue-600 hover:underline text-xs">
                                        Открыть
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
