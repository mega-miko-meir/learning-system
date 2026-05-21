import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

const STATUS_MAP = {
    pending:     { label: "Ожидает",     cls: "bg-yellow-50 text-yellow-700" },
    in_progress: { label: "В процессе",  cls: "bg-blue-50 text-blue-700" },
    completed:   { label: "Выполнено",   cls: "bg-green-50 text-green-700" },
    failed:      { label: "Не пройдено", cls: "bg-red-50 text-red-700" },
    expired:     { label: "Просрочено",  cls: "bg-gray-100 text-gray-500" },
};

function AttemptDetail({ attempt }) {
    return (
        <div className="mt-2 rounded-lg border border-gray-100 overflow-hidden text-xs">
            <div className={`flex items-center gap-3 px-3 py-2 ${attempt.passed ? "bg-green-50" : "bg-red-50"}`}>
                <span className={`font-semibold ${attempt.passed ? "text-green-700" : "text-red-700"}`}>
                    Попытка {attempt.attempt_number} — {attempt.score ?? "—"}%
                </span>
                <span className={`px-1.5 py-0.5 rounded-full ${attempt.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {attempt.passed ? "Сдал" : "Не сдал"}
                </span>
                {attempt.finished_at && (
                    <span className="ml-auto text-gray-400">{attempt.finished_at}</span>
                )}
            </div>

            {attempt.answers.length > 0 ? (
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-3 py-1.5 font-medium text-gray-500 w-1/2">Вопрос</th>
                            <th className="text-left px-3 py-1.5 font-medium text-gray-500">Ответ сотрудника</th>
                            <th className="px-3 py-1.5 text-center font-medium text-gray-500 w-16">Итог</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {attempt.answers.map((a, i) => (
                            <tr key={i} className={a.is_correct ? "bg-green-50/40" : "bg-red-50/30"}>
                                <td className="px-3 py-2 text-gray-700">{a.question ?? "—"}</td>
                                <td className="px-3 py-2 text-gray-600">{a.chosen ?? "—"}</td>
                                <td className="px-3 py-2 text-center">
                                    {a.is_correct
                                        ? <span className="text-green-600 font-bold">✓</span>
                                        : <span className="text-red-500 font-bold">✕</span>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p className="px-3 py-2 text-gray-400 italic">Ответы не сохранены</p>
            )}
        </div>
    );
}

export default function EmployeeShow({ employee, assignments }) {
    const [openAttempts, setOpenAttempts] = useState({});

    const completed = assignments.filter((a) => a.status === "completed").length;
    const percent   = assignments.length > 0 ? Math.round(completed / assignments.length * 100) : 0;

    function toggleAttempts(id) {
        setOpenAttempts((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    return (
        <AppLayout title={employee.full_name}>
            <Head title={employee.full_name} />

            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">
                    <Link href={route("manager.employees")} className="hover:underline">← Мои сотрудники</Link>
                </p>
                <a
                    href={route("manager.employees.pdf", employee.id)}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 flex items-center gap-1.5"
                >
                    ↓ PDF-отчёт
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                                {employee.full_name.charAt(0)}
                            </div>
                            <p className="font-semibold text-gray-900">{employee.full_name}</p>
                        </div>
                        <dl className="space-y-2 text-sm">
                            {[
                                ["Отдел",      employee.department],
                                ["Должность",  employee.position],
                                ["Дата приёма", employee.hired_at],
                            ].map(([l, v]) => v && (
                                <div key={l}>
                                    <dt className="text-xs text-gray-400">{l}</dt>
                                    <dd className="text-gray-700">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Прогресс</p>
                        <p className="text-3xl font-bold text-blue-600">{percent}%</p>
                        <p className="text-xs text-gray-400 mt-0.5">{completed} из {assignments.length}</p>
                        <div className="mt-3 h-2 bg-gray-100 rounded-full">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-3">
                    {assignments.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                            Назначений нет
                        </div>
                    ) : assignments.map((a) => {
                        const s       = STATUS_MAP[a.status] ?? { label: a.status, cls: "bg-gray-100 text-gray-500" };
                        const hasTest = a.attempts?.length > 0;
                        const isOpen  = openAttempts[a.id];

                        return (
                            <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{a.document}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                                            <span className="text-xs text-gray-400">{a.type}</span>
                                            {a.best_score != null && (
                                                <span className="text-xs text-gray-500">
                                                    Лучший результат: <strong>{a.best_score}%</strong>
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400 ml-auto">
                                                {a.completed_at ?? a.due_date ?? "—"}
                                            </span>
                                        </div>
                                    </div>

                                    {hasTest && (
                                        <button
                                            onClick={() => toggleAttempts(a.id)}
                                            className="shrink-0 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                                        >
                                            <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                            </svg>
                                            {isOpen ? "Скрыть" : `Детали теста (${a.attempts.length})`}
                                        </button>
                                    )}
                                </div>

                                {isOpen && (
                                    <div className="mt-3 space-y-2">
                                        {a.attempts.map((att) => (
                                            <AttemptDetail key={att.id} attempt={att} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
