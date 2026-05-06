import { Head } from "@inertiajs/react";
import AppLayout from "../../Layouts/AppLayout";

function StatCard({ label, value, color = "blue" }) {
    const textColors = {
        blue: "text-blue-700",
        green: "text-green-700",
        red: "text-red-700",
        yellow: "text-yellow-700",
    };
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className={`text-3xl font-bold ${textColors[color]}`}>{value}</p>
        </div>
    );
}

export default function Dashboard({ stats, recentActivity }) {
    return (
        <AppLayout title="Панель руководителя">
            <Head title="Панель руководителя" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard label="Сотрудников в команде" value={stats.team_size} color="blue" />
                <StatCard label="Выполнено" value={stats.completed} color="green" />
                <StatCard label="В ожидании" value={stats.pending} color="yellow" />
                <StatCard label="Просрочено" value={stats.overdue} color="red" />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                    Последние активности команды
                </h2>
                {recentActivity.length === 0 ? (
                    <p className="text-sm text-gray-400">Активности пока нет</p>
                ) : (
                    <ul className="space-y-3">
                        {recentActivity.map((item) => (
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
        </AppLayout>
    );
}
