import { Head, useForm, Link } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

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

export default function DocumentForm({ document }) {
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
            : { title: "", type: "", description: "", version: 1, file: null }
    );

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
