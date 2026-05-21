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

                {/* Блок данных для копирования */}
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
                        copiedAll
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 text-white hover:bg-blue-700"
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
                <p className="text-sm text-gray-500 mb-4">
                    Будет создан новый временный пароль.
                </p>
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

export default function UserShow({ employee, assignments }) {
    const { data, setData, post, processing } = useForm({ fired_at: "" });
    const flash = useFlash();

    const [tempPassword, setTempPassword]       = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showResetModal, setShowResetModal]    = useState(false);
    const [passwordModalTitle, setPasswordModalTitle] = useState("");

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

    function openResetModal() {
        setShowResetModal(true);
    }

    function submitReset(mustChange) {
        setShowResetModal(false);
        router.post(route("admin.users.reset-password", employee.id), {
            must_change_password: mustChange,
        });
    }

    function assignTraining() {
        router.post(route("admin.users.assign-training", employee.id));
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

            <p className="text-xs text-gray-400 mb-6">
                <Link href={route("admin.users.index")} className="hover:underline">← Сотрудники</Link>
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Карточка */}
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
                                ["Отдел", employee.department],
                                ["Должность", employee.position],
                                ["Руководитель", employee.manager],
                                ["Email", employee.email],
                                ["Телефон", employee.phone],
                                ["Дата приёма", employee.hired_at],
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
                            {employee.role === "employee" && employee.is_active && (
                                <button
                                    onClick={assignTraining}
                                    title="Назначить обучение по матрице должности"
                                    className="block w-full text-center px-3 py-2 text-sm border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50"
                                >
                                    Автоназначение обучения
                                </button>
                            )}
                            <button
                                onClick={openResetModal}
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
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Назначения обучения</h2>
                    {assignments.length === 0 ? (
                        <p className="text-sm text-gray-400">Назначений нет</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-100">
                                <tr>
                                    <th className="text-left pb-2 font-medium text-gray-500">Документ</th>
                                    <th className="text-left pb-2 font-medium text-gray-500">Статус</th>
                                    <th className="text-left pb-2 font-medium text-gray-500">Срок</th>
                                    <th className="text-left pb-2 font-medium text-gray-500">Результат</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {assignments.map((a) => {
                                    const s = STATUS_MAP[a.status] ?? { label: a.status, cls: "bg-gray-100 text-gray-500" };
                                    return (
                                        <tr key={a.id}>
                                            <td className="py-2.5 pr-4 text-gray-800">{a.document}</td>
                                            <td className="py-2.5 pr-4">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                                            </td>
                                            <td className="py-2.5 pr-4 text-gray-400 text-xs">
                                                {a.completed_at ?? a.due_date ?? "—"}
                                            </td>
                                            <td className="py-2.5 text-gray-500 text-xs">
                                                {a.best_score != null ? `${a.best_score}%` : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
