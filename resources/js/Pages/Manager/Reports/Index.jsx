import { Head, Link } from "@inertiajs/react";
import { useRef, useState, useEffect } from "react";
import AppLayout from "../../../Layouts/AppLayout";

function progressColor(percent) {
    return percent >= 80 ? "bg-green-500" : percent >= 50 ? "bg-blue-500" : "bg-yellow-400";
}

// Выбор отдела(ов) для PDF-выгрузки: ничего не выбрано — выгружается вся команда (как раньше),
// иначе — только отмеченные отделы, той же структурой (секции по отделам), что на экране.
function PdfExportMenu({ byDepartment }) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState([]);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        function onClickOutside(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [open]);

    function toggle(id) {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    }

    function buildHref() {
        if (selected.length === 0) return route("manager.reports.pdf");
        const params = new URLSearchParams();
        selected.forEach((id) => {
            if (id === "none") params.append("no_department", "1");
            else params.append("department_ids[]", id);
        });
        return route("manager.reports.pdf") + "?" + params.toString();
    }

    const summary = selected.length === 0
        ? "Вся команда"
        : `Выбрано отделов: ${selected.length}`;

    return (
        <div ref={rootRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Скачать PDF
            </button>

            {open && (
                <div className="absolute right-0 z-20 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                        Отделы для выгрузки ({summary.toLowerCase()})
                    </p>
                    <div className="max-h-56 overflow-y-auto space-y-1.5 mb-3">
                        {byDepartment.map((dept) => {
                            const key = dept.id ?? "none";
                            return (
                                <label key={key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(key)}
                                        onChange={() => toggle(key)}
                                        className="w-4 h-4 accent-blue-600"
                                    />
                                    {dept.name}
                                    <span className="text-xs text-gray-400">({dept.employees})</span>
                                </label>
                            );
                        })}
                    </div>
                    <div className="flex gap-2">
                        {selected.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelected([])}
                                className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                            >
                                Сбросить
                            </button>
                        )}
                        <a
                            href={buildHref()}
                            onClick={() => setOpen(false)}
                            className="ml-auto px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Скачать PDF
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ManagerReports({ report, byDepartment }) {
    const total     = report.length;
    const allTotal  = report.reduce((s, e) => s + e.total, 0);
    const allDone   = report.reduce((s, e) => s + e.completed, 0);
    const avgPct    = total > 0 ? Math.round(allDone / Math.max(allTotal, 1) * 100) : 0;

    const byDept = report.reduce((acc, e) => {
        const key = e.department ?? "Без отдела";
        acc[key] = acc[key] ?? [];
        acc[key].push(e);
        return acc;
    }, {});

    return (
        <AppLayout title="Отчёт по команде">
            <Head title="Отчёт по команде" />

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-lg font-semibold text-gray-900">Отчёт по команде</h1>
                <PdfExportMenu byDepartment={byDepartment} />
            </div>

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

            {/* Прогресс по отделам — тот же блок, что в отчёте у admin */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-5">Прогресс по отделам</h2>
                {byDepartment.length === 0 ? (
                    <p className="text-sm text-gray-400">Нет данных</p>
                ) : (
                    <div className="space-y-5">
                        {byDepartment.map((dept) => (
                            <div key={dept.name}>
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                                        <span className="text-xs text-gray-400">{dept.employees} чел.</span>
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
                                        className={`h-full rounded-full ${progressColor(dept.percent)}`}
                                        style={{ width: `${dept.percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Сотрудники — сгруппированы по отделам (секциями) */}
            {report.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
                    Нет данных
                </div>
            ) : (
                Object.entries(byDept).map(([deptName, employees]) => (
                    <div key={deptName} className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700">
                                {deptName}
                                <span className="ml-2 text-xs font-normal text-gray-400">{employees.length} чел.</span>
                            </h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-100">
                                <tr>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Сотрудник</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Выполнено</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Просрочено</th>
                                    <th className="text-left px-4 py-3 font-medium text-gray-600">Прогресс</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {employees.map((emp) => (
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
                                                        className={`h-full rounded-full ${progressColor(emp.percent)}`}
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
                ))
            )}
        </AppLayout>
    );
}
