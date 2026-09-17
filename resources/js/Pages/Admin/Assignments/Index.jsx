import { Head, Link, router, useForm } from "@inertiajs/react";
import { useMemo, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";
import { CheckboxList, PickerModal } from "../../../Components/CheckboxPicker";

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

export default function AssignmentsIndex({ assignments, departments, positions, documents, employees }) {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));

    // ── Поиск по сотруднику (фронтенд) ───────────────────────────────
    const [search, setSearch] = useState("");

    const visibleRows = search.trim()
        ? assignments.data.filter((a) =>
              a.user.toLowerCase().includes(search.trim().toLowerCase())
          )
        : assignments.data;

    // ── Bulk assign form ──────────────────────────────────────────────
    const [showBulk,     setShowBulk]     = useState(false);
    const [deptFilter,   setDeptFilter]   = useState("");
    const [positionId,   setPositionId]   = useState("");
    const [userSearch,   setUserSearch]   = useState("");
    const [expandUsers,  setExpandUsers]  = useState(false);

    const bulkForm = useForm({
        user_ids:        [],
        document_id:     "",
        training_type:   "primary",
        due_date:        "",
        reading_minutes: 10,
    });

    const filteredPositions = deptFilter
        ? positions.filter((p) => String(p.department_id) === String(deptFilter))
        : positions;

    const employeesInScope = useMemo(() => employees
        .filter((e) => !deptFilter || String(e.department_id) === String(deptFilter))
        .filter((e) => !positionId || String(e.position_id) === String(positionId)),
        [employees, deptFilter, positionId]
    );

    const availableEmployees = useMemo(() => employeesInScope.filter((e) =>
        !userSearch.trim() || e.name.toLowerCase().includes(userSearch.toLowerCase())
    ), [employeesInScope, userSearch]);

    function handleDeptChange(id) {
        setDeptFilter(id);
        setPositionId("");
        bulkForm.setData("user_ids", []);
    }

    function handlePositionChange(id) {
        setPositionId(id);
        // Удобный дефолт: выбрали должность — сразу подставили всех, кто на ней. Можно донастроить вручную ниже.
        bulkForm.setData("user_ids", id
            ? employees.filter((e) => String(e.position_id) === String(id)).map((e) => e.id)
            : []
        );
    }

    function toggleUser(id) {
        bulkForm.setData("user_ids", bulkForm.data.user_ids.includes(id)
            ? bulkForm.data.user_ids.filter((x) => x !== id)
            : [...bulkForm.data.user_ids, id]
        );
    }

    function toggleAllUsers(allSelected, items) {
        bulkForm.setData("user_ids", allSelected ? [] : items.map((i) => i.id));
    }

    function filter(key, value) {
        router.get(route("admin.assignments.index"), { ...params, [key]: value || undefined }, {
            preserveState: true, replace: true,
        });
    }

    function bulkAssign(e) {
        e.preventDefault();
        bulkForm.post(route("admin.assignments.bulk"), {
            onSuccess: () => {
                bulkForm.reset();
                setDeptFilter(""); setPositionId(""); setUserSearch("");
                setShowBulk(false);
            },
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
                <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Поиск по сотруднику..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >×</button>
                    )}
                </div>

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

                <label className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg cursor-pointer select-none bg-white">
                    <input
                        type="checkbox"
                        checked={params.active_only !== "false"}
                        onChange={(e) => filter("active_only", e.target.checked ? undefined : "false")}
                        className="w-4 h-4 accent-blue-600"
                    />
                    Только активные сотрудники
                </label>

                {search && (
                    <span className="text-xs text-gray-400">
                        Найдено: {visibleRows.length}
                    </span>
                )}

                <button
                    onClick={() => setShowBulk(!showBulk)}
                    className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    + Назначить обучение
                </button>
            </div>

            {/* ── Форма массового назначения ── */}
            {showBulk && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Назначить обучение</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Выберите должность — сотрудники подставятся автоматически, при необходимости донастройте список вручную
                            </p>
                        </div>
                    </div>

                    <form onSubmit={bulkAssign} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Отдел <span className="text-gray-400 font-normal ml-1">(для фильтра)</span>
                                </label>
                                <select
                                    value={deptFilter}
                                    onChange={(e) => handleDeptChange(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">— Все отделы —</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Должность <span className="text-gray-400 font-normal ml-1">(для фильтра)</span>
                                </label>
                                <select
                                    value={positionId}
                                    onChange={(e) => handlePositionChange(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">— Все должности —</option>
                                    {filteredPositions.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Документ <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={bulkForm.data.document_id}
                                    onChange={(e) => bulkForm.setData("document_id", e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {TRAINING_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Сотрудники <span className="text-red-500">*</span>
                                {bulkForm.data.user_ids.length > 0 && (
                                    <span className="ml-1 text-blue-600 font-normal">({bulkForm.data.user_ids.length})</span>
                                )}
                            </label>
                            <CheckboxList
                                items={availableEmployees}
                                selectedIds={bulkForm.data.user_ids}
                                onToggle={toggleUser}
                                onToggleAll={toggleAllUsers}
                                search={userSearch}
                                onSearch={setUserSearch}
                                searchPlaceholder="Поиск сотрудника..."
                                renderItem={(e) => (
                                    <>
                                        <span className="font-medium text-gray-800">{e.name}</span>
                                        <span className="block text-xs text-gray-400">
                                            {[e.position, e.department].filter(Boolean).join(" · ") || "—"}
                                        </span>
                                    </>
                                )}
                                emptyText="Нет сотрудников"
                                error={bulkForm.errors.user_ids}
                                onExpand={() => setExpandUsers(true)}
                            />
                            {expandUsers && (
                                <PickerModal
                                    title="Все сотрудники"
                                    items={employeesInScope}
                                    selectedIds={bulkForm.data.user_ids}
                                    onToggle={toggleUser}
                                    onToggleAll={toggleAllUsers}
                                    renderItem={(e) => (
                                        <>
                                            <span className="font-medium text-gray-800">{e.name}</span>
                                            <span className="block text-xs text-gray-400">
                                                {[e.position, e.department].filter(Boolean).join(" · ") || "—"}
                                            </span>
                                        </>
                                    )}
                                    matchesSearch={(e, q) => e.name.toLowerCase().includes(q.toLowerCase())}
                                    searchPlaceholder="Поиск сотрудника..."
                                    emptyText="Нет сотрудников"
                                    onClose={() => setExpandUsers(false)}
                                />
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Время изучения <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={bulkForm.data.reading_minutes}
                                    onChange={(e) => bulkForm.setData("reading_minutes", parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-gray-400 mt-1">Если не указано — 30 дней от сегодня</p>
                            </div>
                            <div className="lg:col-span-2 flex items-start gap-3 pt-5">
                                <button
                                    type="submit"
                                    disabled={bulkForm.processing || bulkForm.data.user_ids.length === 0 || !bulkForm.data.document_id}
                                    className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {bulkForm.processing ? "Назначаем..." : "Назначить"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowBulk(false); setDeptFilter(""); setPositionId(""); setUserSearch("");
                                        bulkForm.reset();
                                    }}
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
                        {visibleRows.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    {search ? "Сотрудник не найден" : "Назначений нет"}
                                </td>
                            </tr>
                        ) : (
                            visibleRows.map((a) => (
                                <tr key={a.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <Link
                                            href={route("admin.users.show", a.user_id)}
                                            className="text-gray-900 hover:text-blue-600 hover:underline"
                                        >
                                            {a.user}
                                        </Link>
                                        {!a.user_is_active && (
                                            <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">уволен</span>
                                        )}
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

            {!search && <Pagination links={assignments.links} />}

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
