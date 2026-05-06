import { Head, Link } from "@inertiajs/react";
import AppLayout from "../../Layouts/AppLayout";

const STATUS_LABELS = {
    pending: { label: "Ожидает", cls: "bg-yellow-50 text-yellow-700" },
    in_progress: { label: "В процессе", cls: "bg-blue-50 text-blue-700" },
    completed: { label: "Выполнено", cls: "bg-green-50 text-green-700" },
    overdue: { label: "Просрочено", cls: "bg-red-50 text-red-700" },
};

export default function Dashboard({ stats, upcoming }) {
    return (
        <AppLayout title="Мой кабинет">
            <Head title="Мой кабинет" />

            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-sm text-gray-500 mb-1">В ожидании</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-sm text-gray-500 mb-1">Выполнено</p>
                    <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <p className="text-sm text-gray-500 mb-1">Просрочено</p>
                    <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-semibold text-gray-700">
                        Предстоящие задания
                    </h2>
                    <Link
                        href={route("employee.assignments")}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        Все задания →
                    </Link>
                </div>

                {upcoming.length === 0 ? (
                    <p className="text-sm text-gray-400">Нет активных заданий</p>
                ) : (
                    <ul className="space-y-3">
                        {upcoming.map((item) => {
                            const s = STATUS_LABELS[item.status] ?? {
                                label: item.status,
                                cls: "bg-gray-50 text-gray-600",
                            };
                            return (
                                <li
                                    key={item.id}
                                    className="flex items-center gap-3 text-sm"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-800 font-medium truncate">
                                            {item.document}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {item.type === "document"
                                                ? "Изучение документа"
                                                : "Тестирование"}
                                            {item.due_date && ` · до ${item.due_date}`}
                                        </p>
                                    </div>
                                    <span
                                        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${s.cls}`}
                                    >
                                        {s.label}
                                    </span>
                                    <Link
                                        href={route("employee.assignments.show", item.id)}
                                        className="flex-shrink-0 text-xs text-blue-600 hover:underline"
                                    >
                                        Открыть
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </AppLayout>
    );
}
