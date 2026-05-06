import { Head, Link } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

export default function DepartmentReport({ department, employees }) {
    return (
        <AppLayout title={`Отдел: ${department.name}`}>
            <Head title={`Отдел: ${department.name}`} />

            <p className="text-xs text-gray-400 mb-6">
                <Link href={route("admin.reports.index")} className="hover:underline">← Отчёты</Link>
            </p>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">{department.name}</h2>
                    <p className="text-sm text-gray-400">{employees.length} сотрудников</p>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Сотрудник</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Выполнено</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Просрочено</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Прогресс</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {employees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{emp.full_name}</td>
                                <td className="px-4 py-3 text-gray-500 text-xs">{emp.position ?? "—"}</td>
                                <td className="px-4 py-3 text-green-600">{emp.completed}/{emp.total}</td>
                                <td className="px-4 py-3">
                                    {emp.overdue > 0 ? (
                                        <span className="text-red-500">{emp.overdue}</span>
                                    ) : (
                                        <span className="text-gray-300">0</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 w-32">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full">
                                            <div
                                                className={`h-full rounded-full ${
                                                    emp.percent >= 80 ? "bg-green-500" :
                                                    emp.percent >= 50 ? "bg-blue-500"  : "bg-yellow-400"
                                                }`}
                                                style={{ width: `${emp.percent}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-gray-500 w-8 text-right">{emp.percent}%</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={route("admin.reports.employee", emp.id)}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Детали
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
