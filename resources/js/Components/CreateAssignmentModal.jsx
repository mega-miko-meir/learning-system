import { router } from "@inertiajs/react";
import { useState } from "react";

const TRAINING_TYPES = [
    { value: "primary",   label: "Первичный инструктаж" },
    { value: "periodic",  label: "Периодическое" },
    { value: "unplanned", label: "Внеплановое" },
    { value: "special",   label: "Специальное" },
];

const MATRIX_TYPE_LABELS = {
    primary:   "Первичное",
    periodic:  "Периодическое",
    unplanned: "Внеплановое",
    special:   "Специальное",
};

const READING_MINUTES = [5, 10, 15, 20, 30, 45, 60];

// Общая модалка создания обучения — используется и в карточке сотрудника (Admin), и в карточке сотрудника (HR).
// routeName — маршрут, различающийся между ролями (admin.users.assignments.store / hr.users.assign-training).
export default function CreateAssignmentModal({ employeeId, documents, routeName, onClose }) {
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
        router.post(route(routeName, employeeId), {
            document_ids: documentIds,
            training_type: trainingType,
            reading_minutes: readingMinutes,
        }, {
            onFinish: () => setSubmitting(false),
            onSuccess: onClose,
        });
    }

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl h-[85vh] flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 mb-4 shrink-0">Создать обучение</h3>
                <form onSubmit={submit} className="flex-1 flex flex-col min-h-0">
                    <div className="shrink-0 mb-4">
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
                        <div className="flex items-center justify-between mb-1.5 shrink-0">
                            <label className="block text-sm font-medium text-gray-700">
                                Документы {documentIds.length > 0 && <span className="text-blue-600">(выбрано: {documentIds.length})</span>}
                            </label>
                            {filtered.length > 0 && (
                                <button type="button" onClick={toggleAll} className="text-xs text-blue-600 hover:underline">
                                    {allFilteredSelected ? "Снять все" : `Выбрать все (${filtered.length})`}
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Поиск документа..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-2 shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="border border-gray-200 rounded-lg overflow-y-auto flex-1">
                            {filtered.length === 0 ? (
                                <p className="px-3 py-8 text-sm text-gray-400 text-center">
                                    {documents.length === 0
                                        ? "Для должности сотрудника нет документов в матрице обучения"
                                        : "Документы не найдены"}
                                </p>
                            ) : filtered.map((d) => (
                                <label key={d.id}
                                    className={`flex items-start gap-3 px-4 py-3 text-sm border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer ${documentIds.includes(d.id) ? "bg-blue-50" : ""}`}>
                                    <input
                                        type="checkbox"
                                        checked={documentIds.includes(d.id)}
                                        onChange={() => toggle(d.id)}
                                        className="mt-0.5 w-5 h-5 accent-blue-600 shrink-0"
                                    />
                                    <span className="leading-snug">
                                        <span className="text-gray-800">{d.description ?? d.title}</span>
                                        {d.matrix_training_type && (
                                            <span className="block text-xs text-gray-400 mt-0.5">
                                                По матрице: {MATRIX_TYPE_LABELS[d.matrix_training_type] ?? d.matrix_training_type}
                                                {d.matrix_reading_minutes ? ` · ${d.matrix_reading_minutes} мин` : ""}
                                            </span>
                                        )}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="shrink-0 mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Время на изучение (мин)</label>
                        <select value={readingMinutes} onChange={(e) => setReadingMinutes(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {READING_MINUTES.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2 pt-4 shrink-0">
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
