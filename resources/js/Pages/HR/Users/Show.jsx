import { Head, Link, router } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

const STATUS_MAP = {
    pending:     { label: "Ожидает",     cls: "bg-yellow-50 text-yellow-700" },
    in_progress: { label: "В процессе",  cls: "bg-blue-50 text-blue-700" },
    completed:   { label: "Выполнено",   cls: "bg-green-50 text-green-700" },
    failed:      { label: "Не пройдено", cls: "bg-red-50 text-red-700" },
    expired:     { label: "Просрочено",  cls: "bg-gray-100 text-gray-500" },
};

export default function HRUserShow({ employee, assignments }) {
    const completed = assignments.filter((a) => a.status === "completed").length;
    const percent   = assignments.length > 0 ? Math.round(completed / assignments.length * 100) : 0;

    function deactivate() {
        if (confirm(`Деактивировать ${employee.full_name}?`)) {
            router.post(route("hr.users.deactivate", employee.id));
        }
    }

    function activate() {
        router.post(route("hr.users.activate", employee.id));
    }

    function resetPassword() {
        if (confirm("Сбросить пароль? Новый временный пароль будет показан в сообщении.")) {
            router.post(route("hr.users.reset-password", employee.id));
        }
    }

    return (
        <AppLayout title={employee.full_name}>
            <Head title={employee.full_name} />

            <p className="text-xs text-gray-400 mb-6">
                <Link href={route("hr.users.index")} className="hover:underline">← Сотрудники</Link>
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl font-bold text-blue-700">
                                {employee.full_name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{employee.full_name}</p>
                                <p className="text-xs text-gray-400">Сотрудник</p>
                            </div>
                        </div>
                        <dl className="space-y-2.5 text-sm">
                            {[
                                ["Отдел", employee.department],
                                ["Должность", employee.position],
                                ["Руководитель", employee.manager],
                                ["Телефон", employee.phone],
                                ["Дата приёма", employee.hired_at],
                                employee.fired_at && ["Дата увольнения", employee.fired_at],
                            ].filter(Boolean).map(([label, val]) => val && (
                                <div key={label}>
                                    <dt className="text-xs text-gray-400">{label}</dt>
                                    <dd className="text-gray-700">{val}</dd>
                                </div>
                            ))}
                        </dl>

                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-2">
                            <Link href={route("hr.users.edit", employee.id)}
                                className="block w-full text-center px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                                Редактировать
                            </Link>
                            <button onClick={resetPassword}
                                className="block w-full text-center px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                                Сбросить пароль
                            </button>
                            {employee.is_active ? (
                                <button onClick={deactivate}
                                    className="block w-full text-center px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                                    Деактивировать
                                </button>
                            ) : (
                                <button onClick={activate}
                                    className="block w-full text-center px-3 py-2 text-sm border border-green-200 text-green-600 rounded-lg hover:bg-green-50">
                                    Активировать
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Прогресс обучения</p>
                        <p className="text-3xl font-bold text-blue-600 mb-1">{percent}%</p>
                        <p className="text-xs text-gray-400">{completed} из {assignments.length} завершено</p>
                        <div className="mt-3 h-2 bg-gray-100 rounded-full">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
                    <h2 className="text-sm font-semibold text-gray-700 mb-4">Назначения обучения</h2>
                    {assignments.length === 0 ? (
                        <p className="text-sm text-gray-400">Назначений нет</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-100">
                                <tr>
                                    <th className="text-left pb-2 font-medium text-gray-500">Документ</th>
                                    <th className="text-left pb-2 font-medium text-gray-500">Вид</th>
                                    <th className="text-left pb-2 font-medium text-gray-500">Статус</th>
                                    <th className="text-left pb-2 font-medium text-gray-500">Срок</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {assignments.map((a) => {
                                    const s = STATUS_MAP[a.status] ?? { label: a.status, cls: "bg-gray-100 text-gray-500" };
                                    return (
                                        <tr key={a.id}>
                                            <td className="py-2.5 pr-3 text-gray-800">{a.document}</td>
                                            <td className="py-2.5 pr-3 text-gray-400 text-xs">{a.type}</td>
                                            <td className="py-2.5 pr-3">
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                                            </td>
                                            <td className="py-2.5 text-gray-400 text-xs">
                                                {a.completed_at ?? a.due_date ?? "—"}
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
