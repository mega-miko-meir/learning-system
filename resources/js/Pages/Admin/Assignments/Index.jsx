import { Head, Link, router, useForm } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

const STATUS_MAP = {
    pending:     "Ожидает",
    in_progress: "В процессе",
    completed:   "Выполнено",
    failed:      "Не пройдено",
    expired:     "Просрочено",
};

const TRAINING_TYPES = [
    { value: "primary",   label: "Первичное" },
    { value: "periodic",  label: "Периодическое" },
    { value: "unplanned", label: "Внеплановое" },
    { value: "special",   label: "Специальное" },
];

const READING_MINUTES = [5, 10, 15, 20, 30, 45, 60];

export default function AssignmentsIndex({ assignments, departments, positions, documents }) {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));

    // ── Bulk assign form ──────────────────────────────────────────────
    const [showBulk, setShowBulk]     = useState(false);
    const [deptFilter, setDeptFilter] = useState("");

    const bulkForm = useForm({
        position_id:     "",
        document_id:     "",
        training_type:   "primary",
        due_date:        "",
        reading_minutes: 10,
    });

    const filteredPositions = deptFilter
        ? positions.filter((p) => String(p.department_id) === String(deptFilter))
        : positions;

    function filter(key, value) {
        router.get(route("admin.assignments.index"), { ...params, [key]: value || undefined }, {
            preserveState: true, replace: true,
        });
    }

    function bulkAssign(e) {
        e.preventDefault();
        bulkForm.post(route("admin.assignments.bulk"), {
            onSuccess: () => { bulkForm.reset(); setDeptFilter(""); setShowBulk(false); },
        });
    }

    // ── Edit modal ────────────────────────────────────────────────────
    const [editing, setEditing] = useState(null);

    const editForm = useForm({
        training_type:   "primary",
        due_date:        "",
        reading_minutes: 10,
    });

    function openEdit(a) {
        editForm.setData({
            training_type:   a.type,
            due_date:        a.due_date_raw ?? "",
            reading_minutes: a.reading_minutes ?? 10,
        });
        setEditing(a);
    }

    function submitEdit(e) {
        e.preventDefault();
        editForm.put(route("admin.assignments.update", editing.id), {
            onSuccess: () => setEditing(null),
        });
    }

    // ── Confirm dialogs ───────────────────────────────────────────────
    const [confirmDelete, setConfirmDelete] = useState(null); // assignment object
    const [confirmReset,  setConfirmReset]  = useState(null); // assignment object
    const [actionLoading, setActionLoading] = useState(false);

    function doDelete() {
        setActionLoading(true);
        router.delete(route("admin.assignments.destroy", confirmDelete.id), {
            onFinish: () => { setActionLoading(false); setConfirmDelete(null); },
        });
    }

    function doReset() {
        setActionLoading(true);
        router.post(route("admin.assignments.reset", confirmReset.id), {}, {
            onFinish: () => { setActionLoading(false); setConfirmReset(null); },
        });
    }

    return (
        <AppLayout title="Назначения обучения">
            <Head title="Назначения" />

            {/* ── Фильтры и кнопка ── */}
            <div className="flex flex-wrap gap-2 mb-6 items-center">
                <select
                    value={params.status ?? ""}
                    onChange={(e) => filter("status", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Все статусы</option>
                    {Object.entries(STATUS_MAP).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                    ))}
                </select>

                <select
                    value={params.department_id ?? ""}
                    onChange={(e) => filter("department_id", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Все отделы</option>
                    {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>

                <button
                    onClick={() => setShowBulk(!showBulk)}
                    className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    + Назначить обучение
                </button>
            </div>

            {/* ── Форма массового назначения ── */}
            {showBulk && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
                    <h3 className="text-sm font-semibold text-blue-800 mb-1">Назначить обучение по должности</h3>
                    <p className="text-xs text-blue-600 mb-4">
                        Документ будет назначен всем активным сотрудникам выбранной должности.
                    </p>
                    <form onSubmit={bulkAssign} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Отдел <span className="text-gray-400 font-normal ml-1">(для фильтра)</span>
                                </label>
                                <select
                                    value={deptFilter}
                                    onChange={(e) => { setDeptFilter(e.target.value); bulkForm.setData("position_id", ""); }}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">— Все отделы —</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Должность <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={bulkForm.data.position_id}
                                    onChange={(e) => bulkForm.setData("position_id", e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                                        bulkForm.errors.position_id ? "border-red-300" : "border-gray-200"
                                    }`}
                                >
                                    <option value="">— Выберите должность —</option>
                                    {filteredPositions.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {bulkForm.errors.position_id && (
                                    <p className="mt-1 text-xs text-red-600">{bulkForm.errors.position_id}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Документ <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={bulkForm.data.document_id}
                                    onChange={(e) => bulkForm.setData("document_id", e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                                        bulkForm.errors.document_id ? "border-red-300" : "border-gray-200"
                                    }`}
                                >
                                    <option value="">— Выберите документ —</option>
                                    {documents.map((d) => (
                                        <option key={d.id} value={d.id}>{d.description}</option>
                                    ))}
                                </select>
                                {bulkForm.errors.document_id && (
                                    <p className="mt-1 text-xs text-red-600">{bulkForm.errors.document_id}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Вид обучения</label>
                                <select
                                    value={bulkForm.data.training_type}
                                    onChange={(e) => bulkForm.setData("training_type", e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {TRAINING_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-end gap-4 flex-wrap">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Время изучения <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={bulkForm.data.reading_minutes}
                                    onChange={(e) => bulkForm.setData("reading_minutes", parseInt(e.target.value))}
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {READING_MINUTES.map((m) => (
                                        <option key={m} value={m}>{m} мин</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Срок до</label>
                                <input
                                    type="date"
                                    value={bulkForm.data.due_date}
                                    onChange={(e) => bulkForm.setData("due_date", e.target.value)}
                                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                                <p className="text-xs text-gray-400 mt-1">Если не указано — 30 дней от сегодня</p>
                            </div>
                            <div className="flex gap-3 pb-0.5">
                                <button
                                    type="submit"
                                    disabled={bulkForm.processing || !bulkForm.data.position_id || !bulkForm.data.document_id}
                                    className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {bulkForm.processing ? "Назначаем..." : "Назначить"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowBulk(false); setDeptFilter(""); bulkForm.reset(); }}
                                    className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* ── Таблица ── */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Сотрудник</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Документ</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Вид</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Срок</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Сдача теста</th>
                            <th className="text-right px-4 py-3 font-medium text-gray-600">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {assignments.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    Назначений нет
                                </td>
                            </tr>
                        ) : (
                            assignments.data.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={route("admin.users.show", a.user_id)}
                                            className="text-gray-900 hover:text-blue-600 hover:underline"
                                        >
                                            {a.user}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Link
                                            href={route("admin.documents.show", a.document_id)}
                                            className="text-gray-600 hover:text-blue-600 hover:underline text-sm"
                                        >
                                            {a.document}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {TRAINING_TYPES.find((t) => t.value === a.type)?.label ?? a.type}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            a.status === "completed"   ? "bg-green-50 text-green-700"   :
                                            a.status === "failed"      ? "bg-red-50 text-red-600"       :
                                            a.status === "pending"     ? "bg-yellow-50 text-yellow-700" :
                                            a.status === "in_progress" ? "bg-blue-50 text-blue-700"     :
                                            "bg-gray-100 text-gray-500"
                                        }`}>
                                            {STATUS_MAP[a.status] ?? a.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {a.due_date ?? "—"}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {a.completed_at ?? "—"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {/* Редактировать */}
                                            <button
                                                onClick={() => openEdit(a)}
                                                title="Редактировать"
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16.414H8v-2a2 2 0 01.586-1.414z" />
                                                </svg>
                                            </button>

                                            {/* Сбросить (только для failed) */}
                                            {a.status === "failed" && (
                                                <button
                                                    onClick={() => setConfirmReset(a)}
                                                    title="Дать повторную попытку"
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                </button>
                                            )}

                                            {/* Удалить */}
                                            <button
                                                onClick={() => setConfirmDelete(a)}
                                                title="Удалить"
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2H9a2 2 0 00-2 2m10 0H5" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination links={assignments.links} />

            {/* ── Модал редактирования ── */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-base font-semibold text-gray-900 mb-1">Редактировать назначение</h2>
                        <p className="text-xs text-gray-400 mb-5">
                            {editing.user} — {editing.document}
                        </p>

                        <form onSubmit={submitEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Вид обучения</label>
                                <select
                                    value={editForm.data.training_type}
                                    onChange={(e) => editForm.setData("training_type", e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {TRAINING_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Срок выполнения</label>
                                <input
                                    type="date"
                                    value={editForm.data.due_date}
                                    onChange={(e) => editForm.setData("due_date", e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                {editForm.errors.due_date && (
                                    <p className="mt-1 text-xs text-red-600">{editForm.errors.due_date}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Время изучения</label>
                                <select
                                    value={editForm.data.reading_minutes}
                                    onChange={(e) => editForm.setData("reading_minutes", parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                >
                                    {READING_MINUTES.map((m) => (
                                        <option key={m} value={m}>{m} мин</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="flex-1 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {editForm.processing ? "Сохраняем..." : "Сохранить"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditing(null)}
                                    className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Диалог подтверждения сброса ── */}
            {confirmReset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">Сбросить назначение?</h2>
                        <p className="text-xs text-gray-500 text-center mb-5">
                            Все попытки теста <strong>{confirmReset.user}</strong> по документу «{confirmReset.document}»
                            будут удалены. Сотрудник сможет пройти обучение заново.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={doReset}
                                disabled={actionLoading}
                                className="flex-1 py-2 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50"
                            >
                                {actionLoading ? "Сбрасываем..." : "Сбросить"}
                            </button>
                            <button
                                onClick={() => setConfirmReset(null)}
                                className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Диалог подтверждения удаления ── */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2H9a2 2 0 00-2 2m10 0H5" />
                            </svg>
                        </div>
                        <h2 className="text-base font-semibold text-gray-900 text-center mb-1">Удалить назначение?</h2>
                        <p className="text-xs text-gray-500 text-center mb-5">
                            Назначение <strong>{confirmDelete.user}</strong> — «{confirmDelete.document}»
                            будет удалено без возможности восстановления.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={doDelete}
                                disabled={actionLoading}
                                className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:opacity-50"
                            >
                                {actionLoading ? "Удаляем..." : "Удалить"}
                            </button>
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
                            >
                                Отмена
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
