import { Head, Link, router, useForm } from "@inertiajs/react";
import { useEffect, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import { useFlash } from "../../../hooks/useAuth";

const STATUS_MAP = {
    pending:     { label: "Ожидает",     cls: "bg-yellow-50 text-yellow-700" },
    in_progress: { label: "В процессе",  cls: "bg-blue-50 text-blue-700" },
    completed:   { label: "Выполнено",   cls: "bg-green-50 text-green-700" },
    failed:      { label: "Не пройдено", cls: "bg-red-50 text-red-700" },
    expired:     { label: "Просрочено",  cls: "bg-gray-100 text-gray-500" },
};

const ROLE_LABELS = {
    admin: "Администратор", hr_admin: "HR-администратор",
    manager: "Руководитель", employee: "Сотрудник",
};

const TRAINING_TYPES = [
    { value: "primary",   label: "Первичный инструктаж" },
    { value: "periodic",  label: "Периодическое" },
    { value: "unplanned", label: "Внеплановое" },
    { value: "special",   label: "Специальное" },
];

const READING_MINUTES = [5, 10, 15, 20, 30, 45, 60];

function CreateAssignmentModal({ employeeId, documents, onClose }) {
    const [documentIds, setDocumentIds] = useState([]);
    const [trainingType, setTrainingType] = useState("primary");
    const [readingMinutes, setReadingMinutes] = useState(10);
    const [search, setSearch] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const filtered = documents.filter((d) =>
        (d.description ?? d.title ?? "").toLowerCase().includes(search.toLowerCase())
    );
    const allFilteredSelected = filtered.length > 0 && filtered.every((d) => documentIds.includes(d.id));

    function toggle(id) {
        setDocumentIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    }

    function toggleAll() {
        if (allFilteredSelected) {
            setDocumentIds((prev) => prev.filter((id) => !filtered.some((d) => d.id === id)));
        } else {
            setDocumentIds((prev) => [...new Set([...prev, ...filtered.map((d) => d.id)])]);
        }
    }

    function submit(e) {
        e.preventDefault();
        setSubmitting(true);
        router.post(route("admin.users.assignments.store", employeeId), {
            document_ids: documentIds,
            training_type: trainingType,
            reading_minutes: readingMinutes,
        }, {
            onFinish: () => setSubmitting(false),
            onSuccess: onClose,
        });
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Создать обучение</h3>
                <form onSubmit={submit} className="space-y-4 flex-1 flex flex-col min-h-0">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Вид обучения</label>
                        <select value={trainingType} onChange={(e) => setTrainingType(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        {trainingType === "primary" && (
                            <p className="mt-1 text-xs text-gray-400">Срок — сегодня (день в день с оформлением).</p>
                        )}
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col">
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-sm font-medium text-gray-700">
                                Документы {documentIds.length > 0 && `(выбрано: ${documentIds.length})`}
                            </label>
                            <button type="button" onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                                {allFilteredSelected ? "Снять все" : "Выбрать все"}
                            </button>
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Поиск документа..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="border border-gray-200 rounded-lg overflow-y-auto flex-1 min-h-[160px] max-h-60">
                            {filtered.length === 0 ? (
                                <p className="px-3 py-4 text-sm text-gray-400 text-center">Документы не найдены</p>
                            ) : filtered.map((d) => (
                                <label key={d.id} className="flex items-center gap-2 px-3 py-2 text-sm border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={documentIds.includes(d.id)}
                                        onChange={() => toggle(d.id)}
                                        className="w-4 h-4 accent-blue-600 shrink-0"
                                    />
                                    <span className="text-gray-700">{d.description ?? d.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Время на изучение (мин)</label>
                        <select value={readingMinutes} onChange={(e) => setReadingMinutes(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {READING_MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button type="submit" disabled={submitting || documentIds.length === 0}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {submitting ? "Создаём..." : `Создать${documentIds.length > 1 ? ` (${documentIds.length})` : ""}`}
                        </button>
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function TempPasswordModal({ title, password, employee, onClose }) {
    const [copiedAll, setCopiedAll] = useState(false);

    const login = employee?.phone ?? employee?.email ?? "—";

    const credentialsText =
        `ФИО: ${employee?.full_name ?? "—"}\n` +
        `Логин: ${login}\n` +
        `Пароль: ${password}`;

    function copyAll() {
        navigator.clipboard.writeText(credentialsText).catch(() => {});
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <span className="text-green-600 text-lg">✓</span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 mb-3 space-y-1.5 text-sm">
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-400 shrink-0">ФИО</span>
                        <span className="text-gray-900 font-medium text-right">{employee?.full_name ?? "—"}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-400 shrink-0">Логин</span>
                        <span className="font-mono text-gray-900">{login}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                        <span className="text-gray-400 shrink-0">Пароль</span>
                        <span className="font-mono text-gray-900 select-all">{password}</span>
                    </div>
                </div>

                <button
                    onClick={copyAll}
                    className={`w-full px-4 py-2 text-sm rounded-lg font-medium mb-2 transition-colors ${
                        copiedAll ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                >
                    {copiedAll ? "Скопировано ✓" : "Скопировать данные"}
                </button>

                <p className="text-xs text-gray-400 mb-3 text-center">
                    После закрытия пароль больше не будет виден
                </p>
                <button
                    onClick={onClose}
                    className="w-full px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                >
                    Закрыть
                </button>
            </div>
        </div>
    );
}

function ResetPasswordModal({ onConfirm, onClose }) {
    const [mustChange, setMustChange] = useState(true);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Сброс пароля</h3>
                <p className="text-sm text-gray-500 mb-4">Будет создан новый временный пароль.</p>
                <label className="flex items-center gap-2.5 text-sm text-gray-700 mb-6 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={mustChange}
                        onChange={(e) => setMustChange(e.target.checked)}
                        className="w-4 h-4 accent-blue-600"
                    />
                    Потребовать смену пароля при первом входе
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={() => onConfirm(mustChange)}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                        Сбросить
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </div>
    );
}

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

export default function UserShow({ employee, assignments, documents }) {
    const { data, setData, post, processing } = useForm({ fired_at: "" });
    const flash = useFlash();

    const [tempPassword, setTempPassword]             = useState(null);
    const [showPasswordModal, setShowPasswordModal]   = useState(false);
    const [showResetModal, setShowResetModal]          = useState(false);
    const [showAssignModal, setShowAssignModal]        = useState(false);
    const [passwordModalTitle, setPasswordModalTitle] = useState("");
    const [openAttempts, setOpenAttempts]             = useState({});

    useEffect(() => {
        if (flash.temp_password) {
            setTempPassword(flash.temp_password);
            setPasswordModalTitle(
                flash.success === "Сотрудник успешно создан."
                    ? "Сотрудник успешно создан"
                    : "Пароль сброшен"
            );
            setShowPasswordModal(true);
        }
    }, [flash.temp_password]);

    function deactivate() {
        if (confirm(`Деактивировать ${employee.full_name}?`)) {
            post(route("admin.users.deactivate", employee.id));
        }
    }

    function activate() {
        router.post(route("admin.users.activate", employee.id));
    }

    function submitReset(mustChange) {
        setShowResetModal(false);
        router.post(route("admin.users.reset-password", employee.id), {
            must_change_password: mustChange,
        });
    }

    function toggleAttempts(id) {
        setOpenAttempts((prev) => ({ ...prev, [id]: !prev[id] }));
    }

    const completed = assignments.filter((a) => a.status === "completed").length;
    const percent   = assignments.length > 0 ? Math.round(completed / assignments.length * 100) : 0;

    return (
        <AppLayout title={employee.full_name}>
            <Head title={employee.full_name} />

            {showPasswordModal && tempPassword && (
                <TempPasswordModal
                    title={passwordModalTitle}
                    password={tempPassword}
                    employee={employee}
                    onClose={() => setShowPasswordModal(false)}
                />
            )}

            {showResetModal && (
                <ResetPasswordModal
                    onConfirm={submitReset}
                    onClose={() => setShowResetModal(false)}
                />
            )}

            {showAssignModal && (
                <CreateAssignmentModal
                    employeeId={employee.id}
                    documents={documents}
                    onClose={() => setShowAssignModal(false)}
                />
            )}

            <div className="flex items-center justify-between mb-6">
                <p className="text-xs text-gray-400">
                    <Link href={route("admin.users.index")} className="hover:underline">← Сотрудники</Link>
                </p>
                <a
                    href={route("admin.reports.employee.pdf", employee.id)}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 flex items-center gap-1.5"
                >
                    ↓ PDF-отчёт
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Карточка сотрудника */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
                                {employee.full_name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{employee.full_name}</p>
                                <p className="text-xs text-gray-400">{ROLE_LABELS[employee.role] ?? employee.role}</p>
                            </div>
                        </div>

                        <dl className="space-y-2.5 text-sm">
                            {[
                                ["Отдел",           employee.department],
                                ["Должность",       employee.position],
                                ["Руководитель",    employee.manager],
                                ["Email",           employee.email],
                                ["Телефон",         employee.phone],
                                ["Дата приёма",     employee.hired_at],
                                employee.fired_at && ["Дата увольнения", employee.fired_at],
                            ].filter(Boolean).map(([label, val]) => val && (
                                <div key={label}>
                                    <dt className="text-xs text-gray-400">{label}</dt>
                                    <dd className="text-gray-700">{val}</dd>
                                </div>
                            ))}
                        </dl>

                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                            <Link
                                href={route("admin.users.edit", employee.id)}
                                className="block w-full text-center px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Редактировать
                            </Link>
                            <button
                                onClick={() => setShowResetModal(true)}
                                className="block w-full text-center px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Сбросить пароль
                            </button>
                            {employee.is_active ? (
                                <button
                                    onClick={deactivate}
                                    className="block w-full text-center px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                                >
                                    Деактивировать
                                </button>
                            ) : (
                                <button
                                    onClick={activate}
                                    className="block w-full text-center px-3 py-2 text-sm border border-green-200 text-green-600 rounded-lg hover:bg-green-50"
                                >
                                    Активировать
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Прогресс */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-3">Прогресс обучения</p>
                        <p className="text-3xl font-bold text-blue-600 mb-1">{percent}%</p>
                        <p className="text-xs text-gray-400">{completed} из {assignments.length} завершено</p>
                        <div className="mt-3 h-2 bg-gray-100 rounded-full">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                    </div>
                </div>

                {/* Назначения */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-700">Назначения обучения</h2>
                        <button
                            onClick={() => setShowAssignModal(true)}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700"
                        >
                            + Создать обучение
                        </button>
                    </div>
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
