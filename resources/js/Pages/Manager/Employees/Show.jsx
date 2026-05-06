import { Head, Link } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

const STATUS_MAP = {
    pending:     { label: "Ожидает",     cls: "bg-yellow-50 text-yellow-700" },
    in_progress: { label: "В процессе",  cls: "bg-blue-50 text-blue-700" },
    completed:   { label: "Выполнено",   cls: "bg-green-50 text-green-700" },
    failed:      { label: "Не пройдено", cls: "bg-red-50 text-red-700" },
    expired:     { label: "Просрочено",  cls: "bg-gray-100 text-gray-500" },
};

export default function EmployeeShow({ employee, assignments }) {
    const completed = assignments.filter((a) => a.status === "completed").length;
    const percent   = assignments.length > 0 ? Math.round(completed / assignments.length * 100) : 0;

    return (
        <AppLayout title={employee.full_name}>
            <Head title={employee.full_name} />

            <p className="text-xs text-gray-400 mb-6">
                <Link href={route("manager.employees")} className="hover:underline">← Мои сотрудники</Link>
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                                {employee.full_name.charAt(0)}
                            </div>
                            <p className="font-semibold text-gray-900">{employee.full_name}</p>
                        </div>
                        <dl className="space-y-2 text-sm">
                            {[
                                ["Должность", employee.position],
                                ["Дата приёма", employee.hired_at],
                            ].map(([l, v]) => v && (
                                <div key={l}>
                                    <dt className="text-xs text-gray-400">{l}</dt>
                                    <dd className="text-gray-700">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Прогресс</p>
                        <p className="text-3xl font-bold text-blue-600">{percent}%</p>
                        <p className="text-xs text-gray-400 mt-0.5">{completed} из {assignments.length}</p>
                        <div className="mt-3 h-2 bg-gray-100 rounded-full">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Обучение</h2>
                    {assignments.length === 0 ? (
                        <p className="text-sm text-gray-400">Назначений нет</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-100">
                                <tr>
                                    <th className="text-left pb-2 font-medium text-gray-500">Документ</th>
                                    <th className="text-left pb-2 font-medium text-gray-500">Статус</th>
                                    <th className="text-left pb-2 font-medium text-gray-500">Срок</th>
                                    <th className="text-left pb-2 font-medium text-gray-500">Результат</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {assignments.map((a) => {
                                    const s = STATUS_MAP[a.status] ?? { label: a.status, cls: "bg-gray-100 text-gray-500" };
                                    return (
                                        <tr key={a.id}>
                                            <td className="py-2.5 pr-3 text-gray-800">{a.document}</td>
                                            <td className="py-2.5 pr-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                                            </td>
                                            <td className="py-2.5 pr-3 text-gray-400 text-xs">
                                                {a.completed_at ?? a.due_date ?? "—"}
                                            </td>
                                            <td className="py-2.5 text-gray-500 text-xs">
                                                {a.best_score != null ? `${a.best_score}%` : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
