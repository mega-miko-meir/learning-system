import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

// Пересчитывает карточки «Прогресс по отделам» из отфильтрованного списка сотрудников —
// нужно, когда admin переключается на «Мою вертикаль», чтобы цифры совпадали со списком ниже.
function aggregateByDepartment(emps) {
    const byId = {};
    emps.forEach((e) => {
        const key = e.department_id ?? "none";
        const name = e.department ?? "Без отдела";
        byId[key] = byId[key] ?? { id: e.department_id, name, employees: 0, total: 0, completed: 0 };
        byId[key].employees += 1;
        byId[key].total += e.total;
        byId[key].completed += e.completed;
    });
    return Object.values(byId)
        .map((d) => ({ ...d, percent: d.total > 0 ? Math.round(d.completed / d.total * 100) : 0 }))
        .sort((a, b) => a.name.localeCompare(b.name, "ru"));
}

export default function ReportsIndex({ summary, byDepartment, employees, myVerticalIds = [] }) {
    const [departmentId, setDepartmentId] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo]     = useState("");
    const [status, setStatus]     = useState("");
    const [search, setSearch]     = useState("");

    // Admin, который одновременно руководитель (есть подчинённые), может посмотреть на отчёт
    // только по своей вертикали — доступ ко всей компании при этом никуда не пропадает.
    const [scope, setScope] = useState("all"); // "all" | "mine"
    const hasOwnVertical = myVerticalIds.length > 0;
    const myVerticalSet = useMemo(() => new Set(myVerticalIds), [myVerticalIds]);

    const scopedEmployees = useMemo(
        () => scope === "mine" ? employees.filter((e) => myVerticalSet.has(e.id)) : employees,
        [scope, employees, myVerticalSet]
    );

    const scopedSummary = scope === "mine" ? {
        total_employees:     scopedEmployees.length,
        assignments_total:   scopedEmployees.reduce((s, e) => s + e.total, 0),
        assignments_done:    scopedEmployees.reduce((s, e) => s + e.completed, 0),
        assignments_overdue: scopedEmployees.reduce((s, e) => s + e.overdue, 0),
    } : summary;

    const scopedByDepartment = scope === "mine" ? aggregateByDepartment(scopedEmployees) : byDepartment;

    function buildExportUrl() {
        const p = new URLSearchParams();
        if (departmentId) p.set("department_id", departmentId);
        if (dateFrom) p.set("date_from", dateFrom);
        if (dateTo)   p.set("date_to",   dateTo);
        if (status)   p.set("status",    status);
        return route("admin.reports.export") + (p.toString() ? "?" + p.toString() : "");
    }

    function buildDepartmentPdfUrl() {
        const p = new URLSearchParams();
        p.set("department_id", departmentId);
        if (dateFrom) p.set("date_from", dateFrom);
        if (dateTo)   p.set("date_to",   dateTo);
        return route("admin.reports.department-pdf") + "?" + p.toString();
    }

    const filtered = useMemo(() => {
        if (!search.trim()) return scopedEmployees;
        const q = search.trim().toLowerCase();
        return scopedEmployees.filter((e) =>
            e.full_name.toLowerCase().includes(q) ||
            (e.department ?? "").toLowerCase().includes(q) ||
            (e.position ?? "").toLowerCase().includes(q)
        );
    }, [search, scopedEmployees]);

    return (
        <AppLayout title="Отчёты">
            <Head title="Отчёты" />

            {/* Переключатель «Вся компания» / «Моя вертикаль» — только если у admin есть подчинённые */}
            {hasOwnVertical && (
                <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6">
                    {[
                        { key: "all",  label: "Вся компания" },
                        { key: "mine", label: "Моя вертикаль (как руководителя)" },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setScope(key)}
                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                scope === key ? "bg-white text-gray-900 shadow-sm font-medium" : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* Экспорт отчётов */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-1">Экспорт отчётов по обучению</h2>
                <p className="text-xs text-gray-400 mb-4">
                    Excel — полный реестр (отдел и статус необязательны). PDF — сводный отчёт по выбранному отделу.
                </p>
                <div className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Отдел</label>
                        <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Все отделы</option>
                            {byDepartment.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </select>
                    </div>
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
                    {departmentId ? (
                        <a href={buildDepartmentPdfUrl()}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Выгрузить в PDF
                        </a>
                    ) : (
                        <span
                            title="Выберите отдел, чтобы сформировать PDF"
                            className="px-4 py-2 bg-gray-100 text-gray-400 text-sm rounded-lg flex items-center gap-2 cursor-not-allowed">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Выгрузить в PDF
                        </span>
                    )}
                </div>
                {!departmentId && (
                    <p className="text-xs text-gray-400 mt-2">Для PDF выберите отдел — отчёт формируется по одному отделу за раз.</p>
                )}
            </div>

            {/* Сводка */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                    { label: "Сотрудников",      value: scopedSummary.total_employees,     color: "text-blue-600" },
                    { label: "Всего назначений", value: scopedSummary.assignments_total,   color: "text-gray-700" },
                    { label: "Выполнено",         value: scopedSummary.assignments_done,    color: "text-green-600" },
                    { label: "Просрочено",        value: scopedSummary.assignments_overdue, color: "text-red-600"   },
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
                {scopedByDepartment.length === 0 ? (
                    <p className="text-sm text-gray-400">Нет данных</p>
                ) : (
                    <div className="space-y-5">
                        {scopedByDepartment.map((dept) => (
                            <div key={dept.id ?? dept.name}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-3">
                                        {dept.id ? (
                                            <Link
                                                href={route("admin.reports.department", dept.id)}
                                                className="text-sm font-medium text-blue-600 hover:underline"
                                            >
                                                {dept.name}
                                            </Link>
                                        ) : (
                                            <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                                        )}
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
