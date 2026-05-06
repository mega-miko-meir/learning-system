import { Head, Link } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

export default function ManagerReports({ report }) {
    const total     = report.length;
    const allTotal  = report.reduce((s, e) => s + e.total, 0);
    const allDone   = report.reduce((s, e) => s + e.completed, 0);
    const avgPct    = total > 0 ? Math.round(allDone / Math.max(allTotal, 1) * 100) : 0;

    return (
        <AppLayout title="Отчёт по команде">
            <Head title="Отчёт по команде" />

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-sm text-gray-400 mb-1">Сотрудников</p>
                    <p className="text-3xl font-bold text-gray-900">{total}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-sm text-gray-400 mb-1">Средний прогресс</p>
                    <p className="text-3xl font-bold text-blue-600">{avgPct}%</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-sm text-gray-400 mb-1">Выполнено назначений</p>
                    <p className="text-3xl font-bold text-green-600">{allDone}/{allTotal}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Сотрудник</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Выполнено</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Просрочено</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Прогресс</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {report.length === 0 ? (
                            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Нет данных</td></tr>
                        ) : report.map((emp) => (
                            <tr key={emp.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">
                                    <Link href={route("manager.employees.show", emp.id)} className="hover:underline">
                                        {emp.full_name}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-gray-500 text-xs">{emp.position ?? "—"}</td>
                                <td className="px-4 py-3 text-green-600">{emp.completed}/{emp.total}</td>
                                <td className="px-4 py-3">
                                    {emp.overdue > 0 ? (
                                        <span className="text-red-500">{emp.overdue}</span>
                                    ) : <span className="text-gray-300">0</span>}
                                </td>
                                <td className="px-4 py-3 w-36">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                                            <div
                                                className={`h-full rounded-full ${
                                                    emp.percent >= 80 ? "bg-green-500" :
                                                    emp.percent >= 50 ? "bg-blue-500"  : "bg-yellow-400"
                                                }`}
                                                style={{ width: `${emp.percent}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 w-8 text-right">{emp.percent}%</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
