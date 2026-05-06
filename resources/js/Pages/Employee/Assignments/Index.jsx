import { Head, Link, router } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

const STATUS_MAP = {
    pending:     { label: "Ожидает",    cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
    in_progress: { label: "В процессе", cls: "bg-blue-50 text-blue-700 border-blue-200" },
    testing:     { label: "Тестирование", cls: "bg-purple-50 text-purple-700 border-purple-200" },
    completed:   { label: "Выполнено",  cls: "bg-green-50 text-green-700 border-green-200" },
    failed:      { label: "Не пройдено",cls: "bg-red-50 text-red-700 border-red-200" },
    expired:     { label: "Просрочено", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const TYPE_MAP = {
    primary:   "Первичное",
    periodic:  "Периодическое",
    unplanned: "Внеплановое",
    special:   "Специальное",
};

const FILTERS = [
    { value: "", label: "Все" },
    { value: "pending", label: "Ожидает" },
    { value: "in_progress", label: "В процессе" },
    { value: "completed", label: "Выполнено" },
    { value: "failed", label: "Не пройдено" },
];

export default function AssignmentsIndex({ assignments }) {
    const params = new URLSearchParams(window.location.search);
    const currentStatus = params.get("status") ?? "";

    function filter(status) {
        router.get(route("employee.assignments"), status ? { status } : {}, {
            preserveState: true,
            replace: true,
        });
    }

    return (
        <AppLayout title="Мои задания">
            <Head title="Мои задания" />

            {/* Фильтры */}
            <div className="flex gap-2 mb-6">
                {FILTERS.map((f) => (
                    <button
                        key={f.value}
                        onClick={() => filter(f.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            currentStatus === f.value
                                ? "bg-blue-600 text-white"
                                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Список */}
            {assignments.data.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <p className="text-gray-400 text-sm">Заданий нет</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {assignments.data.map((item) => {
                        const s = STATUS_MAP[item.status] ?? { label: item.status, cls: "bg-gray-100 text-gray-600" };
                        return (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {item.document}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {TYPE_MAP[item.type] ?? item.type}
                                        {item.due_date && ` · до ${item.due_date}`}
                                        {item.completed_at && ` · завершено ${item.completed_at}`}
                                    </p>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full border ${s.cls}`}>
                                    {s.label}
                                </span>
                                {!["completed", "failed", "expired"].includes(item.status) && (
                                    <Link
                                        href={route("employee.assignments.show", item.id)}
                                        className="shrink-0 text-sm text-blue-600 hover:underline font-medium"
                                    >
                                        Перейти →
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Пагинация */}
            {assignments.last_page > 1 && (
                <div className="flex gap-2 mt-6 justify-center">
                    {assignments.links.map((link, i) => (
                        <Link
                            key={i}
                            href={link.url ?? "#"}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`px-3 py-1.5 rounded-lg text-sm border ${
                                link.active
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : link.url
                                    ? "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                    : "bg-white text-gray-300 border-gray-100 cursor-default"
                            }`}
                        />
                    ))}
                </div>
            )}
        </AppLayout>
    );
}
