import { Head, router } from "@inertiajs/react";
import { useState, useMemo } from "react";
import AppLayout from "../../../Layouts/AppLayout";

const TRAINING_TYPES = [
    { value: "primary",   label: "Первичное" },
    { value: "periodic",  label: "Периодическое" },
    { value: "unplanned", label: "Внеплановое" },
    { value: "special",   label: "Специальное" },
];

function EditModal({ item, onClose }) {
    const [form, setForm]     = useState({
        training_type:            item.training_type,
        is_mandatory:             item.is_mandatory,
        required_reading_minutes: item.required_reading_minutes,
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    function submit(e) {
        e.preventDefault();
        setSaving(true);
        router.patch(route("admin.matrix.update", item.id), form, {
            preserveScroll: true,
            onSuccess: onClose,
            onError: setErrors,
            onFinish: () => setSaving(false),
        });
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Редактировать запись</h3>
                <p className="text-sm text-gray-400 mb-4">{item.document}</p>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Вид обучения</label>
                        <select value={form.training_type}
                            onChange={(e) => setForm({ ...form, training_type: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Время изучения (мин)</label>
                        <input type="number" min="1" max="9999"
                            value={form.required_reading_minutes}
                            onChange={(e) => setForm({ ...form, required_reading_minutes: parseInt(e.target.value) || 1 })}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.required_reading_minutes ? "border-red-300" : "border-gray-200"}`} />
                        {errors.required_reading_minutes && <p className="mt-1 text-xs text-red-600">{errors.required_reading_minutes}</p>}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={form.is_mandatory}
                            onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })}
                            className="w-4 h-4 accent-blue-600" />
                        Обязательное
                    </label>

                    <div className="flex gap-2 pt-1">
                        <button type="submit" disabled={saving}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {saving ? "Сохраняем..." : "Сохранить"}
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

function ApplyMatrixButton() {
    const [loading, setLoading] = useState(false);
    function apply() {
        if (!confirm("Назначить все документы из матрицы текущим активным сотрудникам? Дубли пропускаются.")) return;
        setLoading(true);
        router.post(route("admin.matrix.apply-all"), {}, { onFinish: () => setLoading(false) });
    }
    return (
        <button onClick={apply} disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Применяем..." : "Применить матрицу к сотрудникам"}
        </button>
    );
}

function SelectableRow({ item, checked, onToggle, renderItem, large }) {
    return (
        <label
            className={`flex items-start gap-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${large ? "px-4 py-3 text-sm" : "px-3 py-2.5 text-sm"} ${checked ? "bg-blue-50" : ""}`}>
            <input type="checkbox" checked={checked} onChange={onToggle}
                className={`mt-0.5 accent-blue-600 shrink-0 ${large ? "w-5 h-5" : "w-4 h-4"}`} />
            <span className="leading-snug">{renderItem(item)}</span>
        </label>
    );
}

function CheckboxList({ items, selectedIds, onToggle, onToggleAll, search, onSearch, searchPlaceholder, renderItem, emptyText, error, onExpand }) {
    const allSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-600">
                    {selectedIds.length > 0 && (
                        <span className="text-blue-600">({selectedIds.length} выбрано)</span>
                    )}
                </span>
                <div className="flex items-center gap-3">
                    {items.length > 0 && (
                        <button type="button" onClick={() => onToggleAll(allSelected, items)}
                            className="text-xs text-blue-500 hover:text-blue-700">
                            {allSelected ? "Снять все" : "Выбрать все"}
                        </button>
                    )}
                    <button type="button" onClick={onExpand}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        Развернуть
                    </button>
                </div>
            </div>
            <input type="text" value={search} onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {items.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">{search ? "Ничего не найдено" : emptyText}</p>
            ) : (
                <div className={`border rounded-lg overflow-hidden max-h-80 overflow-y-auto ${error ? "border-red-300" : "border-gray-200"}`}>
                    {items.map((item) => (
                        <SelectableRow key={item.id} item={item} checked={selectedIds.includes(item.id)}
                            onToggle={() => onToggle(item.id)} renderItem={renderItem} />
                    ))}
                </div>
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function PickerModal({ title, items, selectedIds, onToggle, onToggleAll, renderItem, matchesSearch, searchPlaceholder, emptyText, onClose }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return items;
        return items.filter((i) => matchesSearch(i, search));
    }, [items, search, matchesSearch]);

    const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selectedIds.includes(i.id));

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[85vh] shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {selectedIds.length > 0 ? `Выбрано: ${selectedIds.length}` : "Ничего не выбрано"}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-3 border-b border-gray-100 shrink-0 flex items-center gap-3">
                    <input type="text" autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {filtered.length > 0 && (
                        <button type="button" onClick={() => onToggleAll(allFilteredSelected, filtered)}
                            className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">
                            {allFilteredSelected ? "Снять все" : `Выбрать все (${filtered.length})`}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-gray-400 py-12 text-center">
                            {search ? "Ничего не найдено" : emptyText}
                        </p>
                    ) : (
                        filtered.map((item) => (
                            <SelectableRow key={item.id} item={item} checked={selectedIds.includes(item.id)}
                                onToggle={() => onToggle(item.id)} renderItem={renderItem} large />
                        ))
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
                    <button type="button" onClick={onClose}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                        Готово{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddForm({ positions, documents, departments }) {
    const [departmentId,     setDepartmentId]   = useState("");
    const [selectedPosIds,   setSelectedPosIds] = useState([]);
    const [selectedDocIds,   setSelectedDocIds] = useState([]);
    const [trainingType,     setTrainingType]   = useState("primary");
    const [readingMinutes,   setReadingMinutes] = useState(10);
    const [isMandatory,      setIsMandatory]    = useState(true);
    const [posSearch,        setPosSearch]      = useState("");
    const [docSearch,        setDocSearch]      = useState("");
    const [saving,           setSaving]         = useState(false);
    const [errors,           setErrors]         = useState({});
    const [expanded,         setExpanded]       = useState(null); // 'positions' | 'documents' | null

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
            onSuccess: () => { setSelectedPosIds([]); setSelectedDocIds([]); setPosSearch(""); setDocSearch(""); },
            onError: setErrors,
            onFinish: () => setSaving(false),
        });
    }

    const total = selectedPosIds.length * selectedDocIds.length;

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Добавить записи в матрицу</h2>

            <form onSubmit={submit} className="space-y-4">
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
                        renderItem={(p) => <span className="font-medium text-gray-800">{p.name}</span>}
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
                            renderItem={(p) => <span className="font-medium text-gray-800">{p.name}</span>}
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

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Вид обучения</label>
                    <select value={trainingType} onChange={(e) => setTrainingType(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Время изучения (мин)</label>
                    <input type="number" min="1" max="9999" value={readingMinutes}
                        onChange={(e) => setReadingMinutes(parseInt(e.target.value) || 1)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)}
                        className="w-4 h-4 accent-blue-600" />
                    Обязательное
                </label>

                <button type="submit" disabled={saving || total === 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    {saving
                        ? "Добавляем..."
                        : total > 0
                            ? `Добавить ${total} запис${total === 1 ? "ь" : total < 5 ? "и" : "ей"}`
                            : "Выберите должности и документы"}
                </button>
            </form>
        </div>
    );
}

export default function MatrixIndex({ matrix, positions, documents, departments }) {
    const [filterDept, setFilterDept] = useState("");
    const [filterPos,  setFilterPos]  = useState("");
    const [editItem,   setEditItem]   = useState(null);

    function remove(id) {
        if (confirm("Удалить запись из матрицы?")) {
            router.delete(route("admin.matrix.destroy", id), { preserveScroll: true });
        }
    }

    function handleFilterDeptChange(id) {
        setFilterDept(id);
        setFilterPos("");
    }

    const filteredPositionsForFilter = useMemo(() =>
        filterDept ? positions.filter((p) => p.department_id === Number(filterDept)) : positions,
        [filterDept, positions]
    );

    const filtered = useMemo(() => matrix.filter((m) => {
        if (filterDept && m.department_id !== Number(filterDept)) return false;
        if (filterPos  && m.position_id  !== Number(filterPos))  return false;
        return true;
    }), [matrix, filterDept, filterPos]);

    const grouped = filtered.reduce((acc, m) => {
        const key = m.department ?? "Без отдела";
        acc[key] = acc[key] ?? [];
        acc[key].push(m);
        return acc;
    }, {});

    return (
        <AppLayout title="Матрица обучения">
            <Head title="Матрица обучения" />

            {editItem && <EditModal item={editItem} onClose={() => setEditItem(null)} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <AddForm positions={positions} documents={documents} departments={departments} />
                </div>

                <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <p className="text-sm text-gray-500">
                            {filtered.length !== matrix.length
                                ? <>{filtered.length} <span className="text-gray-400">из {matrix.length}</span></>
                                : <>{matrix.length} записей</>
                            }
                        </p>
                        <ApplyMatrixButton />
                        <div className="ml-auto flex gap-2">
                            <select value={filterDept} onChange={(e) => handleFilterDeptChange(e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Все отделы</option>
                                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <select value={filterPos} onChange={(e) => setFilterPos(e.target.value ? Number(e.target.value) : "")}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">Все должности</option>
                                {filteredPositionsForFilter.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {Object.entries(grouped).map(([dept, rows]) => (
                        <div key={dept} className="mb-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{dept}</h3>
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left px-4 py-2 font-medium text-gray-500">Должность</th>
                                            <th className="text-left px-4 py-2 font-medium text-gray-500">Документ</th>
                                            <th className="text-left px-4 py-2 font-medium text-gray-500">Вид</th>
                                            <th className="text-left px-4 py-2 font-medium text-gray-500">Время</th>
                                            <th className="text-center px-4 py-2 font-medium text-gray-500">Обяз.</th>
                                            <th className="px-4 py-2" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {rows.map((m) => (
                                            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-2.5 text-gray-700">{m.position}</td>
                                                <td className="px-4 py-2.5 text-gray-600">
                                                    {m.document_code && (
                                                        <span className="text-xs font-medium text-gray-400 mr-1.5">{m.document_code}</span>
                                                    )}
                                                    {m.document}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-xs text-gray-500">
                                                        {TRAINING_TYPES.find((t) => t.value === m.training_type)?.label ?? m.training_type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs text-gray-500">{m.required_reading_minutes} мин</td>
                                                <td className="px-4 py-2.5 text-center">
                                                    {m.is_mandatory
                                                        ? <span className="text-green-600 text-xs">✓</span>
                                                        : <span className="text-gray-300 text-xs">—</span>}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button onClick={() => setEditItem(m)}
                                                            className="text-xs text-blue-500 hover:text-blue-700">
                                                            Изменить
                                                        </button>
                                                        <button onClick={() => remove(m.id)}
                                                            className="text-xs text-red-400 hover:text-red-600">
                                                            Удалить
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                            <p className="text-gray-400 text-sm">Матрица пуста</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
