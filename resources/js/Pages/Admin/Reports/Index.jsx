import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

export default function ReportsIndex({ summary, byDepartment, employees }) {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo]     = useState("");
    const [status, setStatus]     = useState("");
    const [search, setSearch]     = useState("");

    function buildExportUrl() {
        const p = new URLSearchParams();
        if (dateFrom) p.set("date_from", dateFrom);
        if (dateTo)   p.set("date_to",   dateTo);
        if (status)   p.set("status",    status);
        return route("admin.reports.export") + (p.toString() ? "?" + p.toString() : "");
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return employees;
        const q = search.trim().toLowerCase();
        return employees.filter((e) =>
            e.full_name.toLowerCase().includes(q) ||
            (e.department ?? "").toLowerCase().includes(q) ||
            (e.position ?? "").toLowerCase().includes(q)
        );
    }, [search, employees]);

    return (
        <AppLayout title="Отчёты">
            <Head title="Отчёты" />

            {/* Excel-экспорт реестра */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">Экспорт реестра обучения (Excel)</h2>
                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Дата с</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Дата по</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Статус</label>
                        <select value={status} onChange={(e) => setStatus(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Все</option>
                            <option value="completed">Выполнено</option>
                            <option value="pending">Ожидает</option>
                            <option value="failed">Не пройдено</option>
                            <option value="expired">Просрочено</option>
                        </select>
                    </div>
                    <a href={buildExportUrl()}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 flex items-center gap-2">
                        ↓ Скачать Excel
                    </a>
                </div>
            </div>

            {/* Сводка */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Сотрудников",      value: summary.total_employees,     color: "text-blue-600" },
                    { label: "Всего назначений", value: summary.assignments_total,   color: "text-gray-700" },
                    { label: "Выполнено",         value: summary.assignments_done,    color: "text-green-600" },
                    { label: "Просрочено",        value: summary.assignments_overdue, color: "text-red-600"   },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                        <p className="text-sm text-gray-400 mb-1">{label}</p>
                        <p className={`text-3xl font-bold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* По отделам */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-5">Прогресс по отделам</h2>
                {byDepartment.length === 0 ? (
                    <p className="text-sm text-gray-400">Нет данных</p>
                ) : (
                    <div className="space-y-5">
                        {byDepartment.map((dept) => (
                            <div key={dept.id}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-3">
                                        <Link
                                            href={route("admin.reports.department", dept.id)}
                                            className="text-sm font-medium text-blue-600 hover:underline"
                                        >
                                            {dept.name}
                                        </Link>
                                        <span className="text-xs text-gray-400">
                                            {dept.employees} чел.
                                        </span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">
                                        {dept.percent}%
                                        <span className="text-xs text-gray-400 font-normal ml-1">
                                            ({dept.completed}/{dept.total})
                                        </span>
                                    </span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${
                                            dept.percent >= 80 ? "bg-green-500" :
                                            dept.percent >= 50 ? "bg-blue-500"  : "bg-yellow-400"
                                        }`}
                                        style={{ width: `${dept.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* По сотрудникам */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-700">
                        Статистика по сотрудникам
                        {search.trim() && (
                            <span className="ml-2 text-xs font-normal text-gray-400">
                                найдено: {filtered.length}
                            </span>
                        )}
                    </h2>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по ФИО, отделу, должности..."
                        className="w-72 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">
                        {search.trim() ? "Сотрудники не найдены" : "Нет сотрудников"}
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-100">
                                <tr>
                                    <th className="text-left pb-2.5 font-medium text-gray-500">ФИО</th>
                                    <th className="text-left pb-2.5 font-medium text-gray-500">Отдел</th>
                                    <th className="text-left pb-2.5 font-medium text-gray-500 hidden lg:table-cell">Должность</th>
                                    <th className="text-center pb-2.5 font-medium text-gray-500 w-16">Всего</th>
                                    <th className="text-center pb-2.5 font-medium text-gray-500 w-20">Выполнено</th>
                                    <th className="text-center pb-2.5 font-medium text-gray-500 w-20">Просрочено</th>
                                    <th className="text-center pb-2.5 font-medium text-gray-500 w-20">Не сдано</th>
                                    <th className="pb-2.5 w-32">Прогресс</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-2.5 pr-3">
                                            <Link
                                                href={route("admin.users.show", emp.id)}
                                                className="font-medium text-blue-600 hover:underline"
                                            >
                                                {emp.full_name}
                                            </Link>
                                        </td>
                                        <td className="py-2.5 pr-3 text-gray-500 text-xs">
                                            {emp.department ?? "—"}
                                        </td>
                                        <td className="py-2.5 pr-3 text-gray-400 text-xs hidden lg:table-cell">
                                            {emp.position ?? "—"}
                                        </td>
                                        <td className="py-2.5 text-center text-gray-700">
                                            {emp.total}
                                        </td>
                                        <td className="py-2.5 text-center">
                                            <span className="text-green-600 font-medium">{emp.completed}</span>
                                        </td>
                                        <td className="py-2.5 text-center">
                                            {emp.overdue > 0
                                                ? <span className="text-red-500 font-medium">{emp.overdue}</span>
                                                : <span className="text-gray-300">—</span>
                                            }
                                        </td>
                                        <td className="py-2.5 text-center">
                                            {emp.failed > 0
                                                ? <span className="text-orange-500 font-medium">{emp.failed}</span>
                                                : <span className="text-gray-300">—</span>
                                            }
                                        </td>
                                        <td className="py-2.5 pl-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            emp.percent >= 80 ? "bg-green-500" :
                                                            emp.percent >= 50 ? "bg-blue-500"  : "bg-yellow-400"
                                                        }`}
                                                        style={{ width: `${emp.percent}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-500 w-8 shrink-0 text-right">
                                                    {emp.percent}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
