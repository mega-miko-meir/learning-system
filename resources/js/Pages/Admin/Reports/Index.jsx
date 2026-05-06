import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

export default function ReportsIndex({ summary, byDepartment }) {
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo]     = useState("");
    const [status, setStatus]     = useState("");

    function buildExportUrl() {
        const p = new URLSearchParams();
        if (dateFrom) p.set("date_from", dateFrom);
        if (dateTo)   p.set("date_to",   dateTo);
        if (status)   p.set("status",    status);
        return route("admin.reports.export") + (p.toString() ? "?" + p.toString() : "");
    }

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
                    { label: "Сотрудников", value: summary.total_employees,     color: "text-blue-600" },
                    { label: "Всего назначений", value: summary.assignments_total,  color: "text-gray-700" },
                    { label: "Выполнено",    value: summary.assignments_done,    color: "text-green-600" },
                    { label: "Просрочено",   value: summary.assignments_overdue, color: "text-red-600"   },
                ].map(({ label, value, color }) => (
                    <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
                        <p className="text-sm text-gray-400 mb-1">{label}</p>
                        <p className={`text-3xl font-bold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* По отделам */}
            <div className="bg-white rounded-xl border border-gray-100 p-5">
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
        </AppLayout>
    );
}
