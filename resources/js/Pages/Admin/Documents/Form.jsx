import { Head, useForm, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import { CheckboxList, PickerModal } from "../../../Components/CheckboxPicker";

const TRAINING_TYPES = [
    { value: "primary",   label: "Первичное" },
    { value: "periodic",  label: "Периодическое" },
    { value: "unplanned", label: "Внеплановое" },
    { value: "special",   label: "Специальное" },
];

const READING_MINUTES = [5, 10, 15, 20, 30, 45, 60];

// Классификация документов согласно Приложению 2 (СМК «Нобел АФФ»)
const DOC_TYPE_GROUPS = [
    {
        level: "Базовый уровень",
        types: ["Внешний нормативный документ"],
    },
    {
        level: "1 уровень — политики и руководства",
        types: [
            "Политика и цели в области качества",
            "Руководство по качеству предприятия",
            "Руководство по качеству лаборатории",
            "Руководство по качеству системы фармаконадзора",
        ],
    },
    {
        level: "2 уровень — процессы и процедуры",
        types: [
            "Регистрационное досье",
            "Досье производственной площадки (Site Master File)",
            "Стандартная операционная процедура (СОП)",
            "Положение о структурном подразделении",
            "Производственная рецептура",
            "Технологическая инструкция",
            "Инструкция по упаковке",
            "Должностная инструкция",
            "Инструкция по охране труда и технике безопасности",
            "Спецификация",
            "Метод контроля качества",
            "Мастер-файл системы фармаконадзора",
        ],
    },
    {
        level: "3 уровень — планирование и распорядительная документация",
        types: [
            "Основной валидационный мастер-план",
            "План / программа / график",
            "Приказ / распоряжение",
            "Служебная / информационная записка",
            "Организационная структура",
        ],
    },
    {
        level: "4 уровень — записи",
        types: [
            "Досье на серию ГЛС / Протокол серии",
            "Досье расследования рекламации",
            "Досье расследования отклонения",
            "Досье расследования изменения",
            "Досье проведения самоинспекции / аудита",
            "Валидационный отчёт",
        ],
    },
    {
        level: "Другое",
        types: ["Другое"],
    },
];

export default function DocumentForm({ document, positions = [] }) {
    const isEdit = !!document;

    // _method: 'put' включён в данные формы (не в опции), чтобы Laravel
    // воспринял POST как PUT при загрузке файлов (multipart не поддерживает PUT).
    const { data, setData, post, processing, errors } = useForm(
        isEdit
            ? {
                  _method: "put",
                  title: document.title,
                  type: document.type,
                  description: document.description ?? "",
                  version: document.version ?? 1,
                  file: null,
              }
            : {
                  title: "", type: "", description: "", version: 1, file: null,
                  position_ids: [],
                  matrix_training_type: "primary",
                  matrix_is_mandatory: true,
                  matrix_reading_minutes: 10,
              }
    );

    // ── Быстрая привязка к матрице обучения (только при создании) ──────
    const [deptFilter, setDeptFilter]   = useState("");
    const [posSearch, setPosSearch]     = useState("");
    const [expandPos, setExpandPos]     = useState(false);

    const positionsInDept = useMemo(() =>
        deptFilter ? positions.filter((p) => String(p.department_id) === String(deptFilter)) : positions,
        [positions, deptFilter]
    );
    const availablePositions = useMemo(() =>
        positionsInDept.filter((p) => !posSearch.trim() || p.name.toLowerCase().includes(posSearch.toLowerCase())),
        [positionsInDept, posSearch]
    );
    const departments = useMemo(() => {
        const seen = new Map();
        positions.forEach((p) => {
            if (p.department_id && !seen.has(p.department_id)) seen.set(p.department_id, p.department);
        });
        return Array.from(seen, ([id, name]) => ({ id, name }));
    }, [positions]);

    function togglePosition(id) {
        setData("position_ids", data.position_ids.includes(id)
            ? data.position_ids.filter((x) => x !== id)
            : [...data.position_ids, id]
        );
    }
    function toggleAllPositions(allSelected, items) {
        setData("position_ids", allSelected ? [] : items.map((i) => i.id));
    }

    function submit(e) {
        e.preventDefault();
        post(
            isEdit
                ? route("admin.documents.update", document.id)
                : route("admin.documents.store"),
            { forceFormData: true }
        );
    }

    return (
        <AppLayout
            title={isEdit ? "Редактировать документ" : "Добавить документ"}
        >
            <Head
                title={isEdit ? "Редактировать документ" : "Добавить документ"}
            />

            <div className="max-w-xl">
                <p className="text-xs text-gray-400 mb-6">
                    <Link
                        href={route("admin.documents.index")}
                        className="hover:underline"
                    >
                        ← Документы
                    </Link>
                </p>

                <form
                    onSubmit={submit}
                    className="bg-white rounded-xl border border-gray-100 p-6 space-y-5"
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Тип документа{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={data.type}
                            onChange={(e) => setData("type", e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.type
                                    ? "border-red-300"
                                    : "border-gray-200"
                            }`}
                        >
                            <option value="">— Выберите —</option>
                            {DOC_TYPE_GROUPS.map((g) => (
                                <optgroup key={g.level} label={g.level}>
                                    {g.types.map((t) => (
                                        <option key={t} value={t}>
                                            {t}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                        {errors.type && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.type}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Код документа{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.title
                                    ? "border-red-300"
                                    : "border-gray-200"
                            }`}
                        />
                        {errors.title && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Название документа{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            rows={3}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                                errors.description
                                    ? "border-red-300"
                                    : "border-gray-200"
                            }`}
                        />
                        {errors.description && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Версия <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={data.version}
                            onChange={(e) =>
                                setData("version", e.target.value)
                            }
                            className={`w-32 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.version
                                    ? "border-red-300"
                                    : "border-gray-200"
                            }`}
                        />
                        {errors.version && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.version}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Файл PDF{" "}
                            {!isEdit && <span className="text-red-500">*</span>}
                            {isEdit && (
                                <span className="text-gray-400 font-normal">
                                    {" "}
                                    (оставьте пустым чтобы не менять)
                                </span>
                            )}
                        </label>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => setData("file", e.target.files[0])}
                            className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:text-sm hover:file:bg-blue-100"
                        />
                        {errors.file && (
                            <p className="mt-1 text-xs text-red-600">
                                {errors.file}
                            </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400">
                            PDF, DOC, DOCX — до 20 МБ
                        </p>
                    </div>

                    {!isEdit && (
                        <div className="border-t border-gray-100 pt-5">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                                Матрица обучения{" "}
                                <span className="text-gray-400 font-normal">(необязательно)</span>
                            </p>
                            <p className="text-xs text-gray-400 mb-3">
                                Выберите должности — документ сразу привяжется к ним в матрице обучения, не нужно отдельно заходить в раздел «Матрица».
                            </p>

                            <div className="mb-3">
                                <label className="block text-xs font-medium text-gray-600 mb-1">Отдел (фильтр)</label>
                                <select
                                    value={deptFilter}
                                    onChange={(e) => { setDeptFilter(e.target.value); setData("position_ids", []); }}
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
                                    Должности
                                    {data.position_ids.length > 0 && (
                                        <span className="ml-1 text-blue-600">({data.position_ids.length})</span>
                                    )}
                                </label>
                                <CheckboxList
                                    items={availablePositions}
                                    selectedIds={data.position_ids}
                                    onToggle={togglePosition}
                                    onToggleAll={toggleAllPositions}
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
                                    onExpand={() => setExpandPos(true)}
                                />
                                {expandPos && (
                                    <PickerModal
                                        title={deptFilter
                                            ? `Должности — ${departments.find((d) => String(d.id) === deptFilter)?.name ?? ""}`
                                            : "Все должности"}
                                        items={positionsInDept}
                                        selectedIds={data.position_ids}
                                        onToggle={togglePosition}
                                        onToggleAll={toggleAllPositions}
                                        renderItem={(p) => (
                                            <span className="font-medium text-gray-800">
                                                {p.name}
                                                {p.department && <span className="ml-1.5 font-normal text-gray-400">({p.department})</span>}
                                            </span>
                                        )}
                                        matchesSearch={(p, q) => p.name.toLowerCase().includes(q.toLowerCase())}
                                        searchPlaceholder="Поиск должности..."
                                        emptyText="Нет должностей"
                                        onClose={() => setExpandPos(false)}
                                    />
                                )}
                            </div>

                            {data.position_ids.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Вид обучения</label>
                                        <select
                                            value={data.matrix_training_type}
                                            onChange={(e) => setData("matrix_training_type", e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {TRAINING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Время изучения</label>
                                        <select
                                            value={data.matrix_reading_minutes}
                                            onChange={(e) => setData("matrix_reading_minutes", parseInt(e.target.value))}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {READING_MINUTES.map((m) => <option key={m} value={m}>{m} мин</option>)}
                                        </select>
                                    </div>
                                    <label className="col-span-2 flex items-center gap-2 text-sm text-gray-700">
                                        <input type="checkbox" checked={data.matrix_is_mandatory}
                                            onChange={(e) => setData("matrix_is_mandatory", e.target.checked)}
                                            className="w-4 h-4 accent-blue-600" />
                                        Обязательное
                                    </label>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing
                                ? "Сохраняем..."
                                : isEdit
                                  ? "Сохранить"
                                  : "Загрузить"}
                        </button>
                        <Link
                            href={
                                isEdit
                                    ? route("admin.documents.show", document.id)
                                    : route("admin.documents.index")
                            }
                            className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                        >
                            Отмена
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
