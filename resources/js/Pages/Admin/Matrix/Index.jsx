import { Head, router } from "@inertiajs/react";
import { useState, useMemo } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import { CheckboxList, PickerModal } from "../../../Components/CheckboxPicker";

const TRAINING_TYPES = [
    { value: "primary",   label: "Первичное" },
    { value: "periodic",  label: "Периодическое" },
    { value: "unplanned", label: "Внеплановое" },
    { value: "special",   label: "Специальное" },
];

const READING_MINUTES = [5, 10, 15, 20, 30, 45, 60];

function ApplyMatrixButton() {
    const [loading, setLoading] = useState(false);
    function apply() {
        if (!confirm("Назначить все документы из матрицы текущим активным сотрудникам? Дубли пропускаются.")) return;
        setLoading(true);
        router.post(route("admin.matrix.apply-all"), {}, { onFinish: () => setLoading(false) });
    }
    return (
        <button onClick={apply} disabled={loading}
            className="px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50">
            {loading ? "Применяем..." : "Применить матрицу к сотрудникам"}
        </button>
    );
}

// Второстепенное, «пакетное» действие: привязать документ(ы) сразу к нескольким должностям.
// Основной сценарий экрана — точечная настройка одной должности в панели справа.
function BulkApplyModal({ positions, documents, departments, onClose }) {
    const [departmentId,   setDepartmentId]   = useState("");
    const [selectedPosIds, setSelectedPosIds] = useState([]);
    const [selectedDocIds, setSelectedDocIds] = useState([]);
    const [trainingType,   setTrainingType]   = useState("primary");
    const [readingMinutes, setReadingMinutes] = useState(10);
    const [isMandatory,    setIsMandatory]    = useState(true);
    const [posSearch,      setPosSearch]      = useState("");
    const [docSearch,      setDocSearch]      = useState("");
    const [saving,         setSaving]         = useState(false);
    const [errors,         setErrors]         = useState({});
    const [expanded,       setExpanded]       = useState(null); // 'positions' | 'documents' | null

    function handleDepartmentChange(id) {
        setDepartmentId(id);
        setSelectedPosIds([]);
        setPosSearch("");
    }

    const positionsInDept = useMemo(() =>
        departmentId ? positions.filter((p) => p.department_id === Number(departmentId)) : positions,
        [positions, departmentId]
    );

    const availablePositions = useMemo(() => {
        return positionsInDept.filter((p) =>
            !posSearch.trim() || p.name.toLowerCase().includes(posSearch.toLowerCase())
        );
    }, [positionsInDept, posSearch]);

    const availableDocs = useMemo(() => {
        return documents.filter((d) =>
            !docSearch.trim() ||
            d.description.toLowerCase().includes(docSearch.toLowerCase()) ||
            d.title.toLowerCase().includes(docSearch.toLowerCase())
        );
    }, [documents, docSearch]);

    function togglePos(id) {
        setSelectedPosIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    }
    function toggleAllPos(allSelected, items) {
        setSelectedPosIds(allSelected ? [] : items.map((i) => i.id));
    }
    function toggleDoc(id) {
        setSelectedDocIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    }
    function toggleAllDoc(allSelected, items) {
        setSelectedDocIds(allSelected ? [] : items.map((i) => i.id));
    }

    function submit(e) {
        e.preventDefault();
        setErrors({});
        const errs = {};
        if (selectedPosIds.length === 0) errs.position_ids = "Выберите хотя бы одну должность";
        if (selectedDocIds.length === 0) errs.document_ids = "Выберите хотя бы один документ";
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        router.post(route("admin.matrix.store"), {
            position_ids:             selectedPosIds,
            document_ids:             selectedDocIds,
            training_type:            trainingType,
            is_mandatory:             isMandatory,
            required_reading_minutes: readingMinutes,
        }, {
            preserveScroll: true,
            onSuccess: onClose,
            onError: setErrors,
            onFinish: () => setSaving(false),
        });
    }

    const total = selectedPosIds.length * selectedDocIds.length;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Массовое применение</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Привязать один или несколько документов сразу к нескольким должностям</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={submit} className="px-6 py-4 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Отдел (фильтр)</label>
                        <select value={departmentId} onChange={(e) => handleDepartmentChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">— Все отделы —</option>
                            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Должности *{selectedPosIds.length > 0 && <span className="ml-1 text-blue-600">({selectedPosIds.length})</span>}
                        </label>
                        <CheckboxList
                            items={availablePositions}
                            selectedIds={selectedPosIds}
                            onToggle={togglePos}
                            onToggleAll={toggleAllPos}
                            search={posSearch}
                            onSearch={setPosSearch}
                            searchPlaceholder="Поиск должности..."
                            renderItem={(p) => (
                                <span className="font-medium text-gray-800">
                                    {p.name}
                                    {p.department && <span className="ml-1.5 font-normal text-gray-400">({p.department})</span>}
                                </span>
                            )}
                            emptyText="Нет должностей"
                            error={errors.position_ids}
                            onExpand={() => setExpanded("positions")}
                        />
                        {expanded === "positions" && (
                            <PickerModal
                                title={departmentId
                                    ? `Должности — ${departments.find((d) => d.id === Number(departmentId))?.name ?? ""}`
                                    : "Все должности"}
                                items={positionsInDept}
                                selectedIds={selectedPosIds}
                                onToggle={togglePos}
                                onToggleAll={toggleAllPos}
                                renderItem={(p) => (
                                    <span className="font-medium text-gray-800">
                                        {p.name}
                                        {p.department && <span className="ml-1.5 font-normal text-gray-400">({p.department})</span>}
                                    </span>
                                )}
                                matchesSearch={(p, q) => p.name.toLowerCase().includes(q.toLowerCase())}
                                searchPlaceholder="Поиск должности..."
                                emptyText="Нет должностей"
                                onClose={() => setExpanded(null)}
                            />
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Документы *{selectedDocIds.length > 0 && <span className="ml-1 text-blue-600">({selectedDocIds.length})</span>}
                        </label>
                        <CheckboxList
                            items={availableDocs}
                            selectedIds={selectedDocIds}
                            onToggle={toggleDoc}
                            onToggleAll={toggleAllDoc}
                            search={docSearch}
                            onSearch={setDocSearch}
                            searchPlaceholder="Поиск документа..."
                            renderItem={(d) => (
                                <>
                                    <span className="font-medium text-gray-800">{d.title}</span>
                                    <span className="block text-xs text-gray-400">{d.description}</span>
                                </>
                            )}
                            emptyText="Нет документов"
                            error={errors.document_ids}
                            onExpand={() => setExpanded("documents")}
                        />
                        {expanded === "documents" && (
                            <PickerModal
                                title="Все документы"
                                items={documents}
                                selectedIds={selectedDocIds}
                                onToggle={toggleDoc}
                                onToggleAll={toggleAllDoc}
                                renderItem={(d) => (
                                    <>
                                        <span className="font-medium text-gray-800">{d.title}</span>
                                        <span className="block text-xs text-gray-400">{d.description}</span>
                                    </>
                                )}
                                matchesSearch={(d, q) => {
                                    const needle = q.toLowerCase();
                                    return d.title.toLowerCase().includes(needle) || d.description.toLowerCase().includes(needle);
                                }}
                                searchPlaceholder="Поиск документа..."
                                emptyText="Нет документов"
                                onClose={() => setExpanded(null)}
                            />
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Вид обучения</label>
                            <select value={trainingType} onChange={(e) => setTrainingType(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Время изучения</label>
                            <select value={readingMinutes} onChange={(e) => setReadingMinutes(parseInt(e.target.value))}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {READING_MINUTES.map((m) => <option key={m} value={m}>{m} мин</option>)}
                            </select>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)}
                            className="w-4 h-4 accent-blue-600" />
                        Обязательное
                    </label>

                    <div className="flex gap-3 pt-1">
                        <button type="submit" disabled={saving || total === 0}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                            {saving
                                ? "Применяем..."
                                : total > 0
                                    ? `Применить (${total} запис${total === 1 ? "ь" : total < 5 ? "и" : "ей"})`
                                    : "Выберите должности и документы"}
                        </button>
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function PositionsPanel({ positions, countByPosition, departments, deptFilter, setDeptFilter, search, setSearch, selectedId, onSelect }) {
    const filtered = useMemo(() => positions
        .filter((p) => !deptFilter || String(p.department_id) === String(deptFilter))
        .filter((p) => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase())),
        [positions, deptFilter, search]
    );

    return (
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col h-[75vh]">
            <div className="p-4 border-b border-gray-100 space-y-2 shrink-0">
                <h2 className="text-sm font-semibold text-gray-700">Должности</h2>
                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Все отделы</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск должности..."
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1 overflow-y-auto">
                {filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">Ничего не найдено</p>
                ) : filtered.map((p) => {
                    const count = countByPosition[p.id] ?? 0;
                    const active = p.id === selectedId;
                    return (
                        <button key={p.id} type="button" onClick={() => onSelect(p.id)}
                            className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left border-b border-gray-50 last:border-0 transition-colors ${
                                active ? "bg-indigo-50 border-l-2 border-l-indigo-600" : "hover:bg-gray-50 border-l-2 border-l-transparent"
                            }`}>
                            <span className="min-w-0">
                                <span className={`block text-sm truncate ${active ? "text-indigo-700 font-medium" : "text-gray-800"}`}>{p.name}</span>
                                {p.department && <span className="block text-xs text-gray-400 truncate">{p.department}</span>}
                            </span>
                            <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded-full ${
                                count > 0 ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-400"
                            }`}>{count}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function RequirementRow({ document, matrixRow, defaults, onAdd, onRemove, onUpdate, saving }) {
    const required = !!matrixRow;
    return (
        <div className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${required ? "bg-indigo-50/40" : ""}`}>
            <input type="checkbox" checked={required} disabled={saving}
                onChange={() => required ? onRemove(matrixRow.id, document.id) : onAdd(document.id)}
                className="mt-1 w-4 h-4 accent-indigo-600 shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{document.title}</p>
                <p className="text-xs text-gray-400">{document.description}</p>

                {required && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <select value={matrixRow.training_type} disabled={saving}
                            onChange={(e) => onUpdate(matrixRow.id, document.id, { training_type: e.target.value })}
                            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <select value={matrixRow.required_reading_minutes} disabled={saving}
                            onChange={(e) => onUpdate(matrixRow.id, document.id, { required_reading_minutes: parseInt(e.target.value) })}
                            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {READING_MINUTES.map((m) => <option key={m} value={m}>{m} мин</option>)}
                        </select>
                        <label className="flex items-center gap-1 text-xs text-gray-500">
                            <input type="checkbox" checked={matrixRow.is_mandatory} disabled={saving}
                                onChange={(e) => onUpdate(matrixRow.id, document.id, { is_mandatory: e.target.checked })}
                                className="w-3.5 h-3.5 accent-indigo-600" />
                            Обязательное
                        </label>
                    </div>
                )}
            </div>
            {saving && (
                <svg className="w-4 h-4 text-gray-300 animate-spin shrink-0 mt-1" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
            )}
        </div>
    );
}

function RequirementsPanel({ position, documents, rows }) {
    const [docSearch, setDocSearch] = useState("");
    const [savingDocId, setSavingDocId] = useState(null);
    const [defaultType, setDefaultType] = useState("primary");
    const [defaultMinutes, setDefaultMinutes] = useState(10);

    const rowByDocId = useMemo(() => Object.fromEntries(rows.map((r) => [r.document_id, r])), [rows]);

    const filteredDocs = useMemo(() => documents.filter((d) =>
        !docSearch.trim() ||
        d.title.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.description.toLowerCase().includes(docSearch.toLowerCase())
    ), [documents, docSearch]);

    function addRequirement(documentId) {
        if (!position) return;
        setSavingDocId(documentId);
        router.post(route("admin.matrix.store"), {
            position_ids:             [position.id],
            document_ids:             [documentId],
            training_type:            defaultType,
            is_mandatory:             true,
            required_reading_minutes: defaultMinutes,
        }, {
            preserveScroll: true, preserveState: true, only: ["matrix"],
            onFinish: () => setSavingDocId(null),
        });
    }

    function removeRequirement(matrixId, documentId) {
        setSavingDocId(documentId);
        router.delete(route("admin.matrix.destroy", matrixId), {
            preserveScroll: true, preserveState: true, only: ["matrix"],
            onFinish: () => setSavingDocId(null),
        });
    }

    function updateRequirement(matrixId, documentId, patch) {
        setSavingDocId(documentId);
        router.patch(route("admin.matrix.update", matrixId), patch, {
            preserveScroll: true, preserveState: true, only: ["matrix"],
            onFinish: () => setSavingDocId(null),
        });
    }

    if (!position) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 h-[75vh] flex items-center justify-center">
                <p className="text-sm text-gray-400">Выберите должность слева, чтобы настроить требуемые документы</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col h-[75vh]">
            <div className="p-4 border-b border-gray-100 shrink-0">
                <h2 className="text-sm font-semibold text-gray-900">{position.name}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                    {position.department && `${position.department} · `}Требуется документов: {rows.length}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className="text-xs text-gray-500">Для новых отметок:</span>
                    <select value={defaultType} onChange={(e) => setDefaultType(e.target.value)}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <select value={defaultMinutes} onChange={(e) => setDefaultMinutes(parseInt(e.target.value))}
                        className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        {READING_MINUTES.map((m) => <option key={m} value={m}>{m} мин</option>)}
                    </select>
                </div>

                <input type="text" value={docSearch} onChange={(e) => setDocSearch(e.target.value)}
                    placeholder="Поиск документа..."
                    className="w-full mt-3 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredDocs.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">Ничего не найдено</p>
                ) : filteredDocs.map((d) => (
                    <RequirementRow key={d.id} document={d} matrixRow={rowByDocId[d.id]}
                        onAdd={addRequirement} onRemove={removeRequirement} onUpdate={updateRequirement}
                        saving={savingDocId === d.id} />
                ))}
            </div>
        </div>
    );
}

export default function MatrixIndex({ matrix, positions, documents, departments }) {
    const [deptFilter,   setDeptFilter]   = useState("");
    const [posSearch,    setPosSearch]    = useState("");
    const [selectedId,   setSelectedId]   = useState(null);
    const [showBulk,     setShowBulk]     = useState(false);

    const countByPosition = useMemo(() => {
        const map = {};
        matrix.forEach((m) => { map[m.position_id] = (map[m.position_id] ?? 0) + 1; });
        return map;
    }, [matrix]);

    const selectedPosition = positions.find((p) => p.id === selectedId) ?? null;
    const rowsForSelected  = useMemo(() =>
        selectedId ? matrix.filter((m) => m.position_id === selectedId) : [],
        [matrix, selectedId]
    );

    return (
        <AppLayout title="Матрица обучения">
            <Head title="Матрица обучения" />

            {showBulk && (
                <BulkApplyModal positions={positions} documents={documents} departments={departments}
                    onClose={() => setShowBulk(false)} />
            )}

            <div className="flex items-center gap-3 mb-6 flex-wrap">
                <p className="text-sm text-gray-500">
                    {matrix.length} правил · {positions.length} должностей
                </p>
                <div className="ml-auto flex gap-2">
                    <ApplyMatrixButton />
                    <button onClick={() => setShowBulk(true)}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                        Массовое применение
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <PositionsPanel
                        positions={positions}
                        countByPosition={countByPosition}
                        departments={departments}
                        deptFilter={deptFilter}
                        setDeptFilter={setDeptFilter}
                        search={posSearch}
                        setSearch={setPosSearch}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                    />
                </div>
                <div className="lg:col-span-2">
                    <RequirementsPanel position={selectedPosition} documents={documents} rows={rowsForSelected} />
                </div>
            </div>
        </AppLayout>
    );
}
