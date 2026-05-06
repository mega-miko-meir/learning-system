import { Head } from "@inertiajs/react";
import AppLayout from "../../Layouts/AppLayout";

function StatCard({ label, value, color = "blue" }) {
    const colors = {
        blue: "bg-blue-50 text-blue-700",
        green: "bg-green-50 text-green-700",
        red: "bg-red-50 text-red-700",
        yellow: "bg-yellow-50 text-yellow-700",
    };
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${colors[color].split(" ")[1]}`}>
                {value}
            </p>
        </div>
    );
}

export default function Dashboard({ stats, departments, recent }) {
    return (
        <AppLayout title="Дашборд">
            <Head title="Дашборд" />

            {/* Статистика */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard label="Сотрудников" value={stats.total_employees} color="blue" />
                <StatCard label="Документов" value={stats.total_documents} color="blue" />
                <StatCard label="Всего назначений" value={stats.assignments_total} color="blue" />
                <StatCard label="Выполнено" value={stats.assignments_done} color="green" />
                <StatCard label="В ожидании" value={stats.assignments_pending} color="yellow" />
                <StatCard label="Просрочено" value={stats.assignments_overdue} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Прогресс по отделам */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">
                        Прогресс по отделам
                    </h2>
                    {departments.length === 0 ? (
                        <p className="text-sm text-gray-400">Нет данных</p>
                    ) : (
                        <ul className="space-y-4">
                            {departments.map((dept) => (
                                <li key={dept.id}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700 font-medium">{dept.name}</span>
                                        <span className="text-gray-400">
                                            {dept.completed}/{dept.total} ({dept.percent}%)
                                        </span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all"
                                            style={{ width: `${dept.percent}%` }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Последние активности */}
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">
                        Последние активности
                    </h2>
                    {recent.length === 0 ? (
                        <p className="text-sm text-gray-400">Активности пока нет</p>
                    ) : (
                        <ul className="space-y-3">
                            {recent.map((item) => (
                                <li key={item.id} className="flex items-start gap-3 text-sm">
                                    <span
                                        className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                                            item.status === "completed"
                                                ? "bg-green-500"
                                                : "bg-red-500"
                                        }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-gray-800 truncate">
                                            <span className="font-medium">{item.user}</span>
                                            {" — "}
                                            {item.document}
                                        </p>
                                        <p className="text-gray-400 text-xs">{item.updated_at}</p>
                                    </div>
                                    <span
                                        className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                                            item.status === "completed"
                                                ? "bg-green-50 text-green-700"
                                                : "bg-red-50 text-red-700"
                                        }`}
                                    >
                                        {item.status === "completed" ? "Выполнено" : "Провалено"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
