import { Head, Link } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

export default function HRDepartmentsIndex({ departments }) {
    return (
        <AppLayout title="Отделы">
            <Head title="Отделы" />

            <div className="flex justify-end mb-6">
                <Link href={route("hr.departments.create")}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    + Добавить отдел
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Код</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Сокращение</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Руководитель</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Сотрудников</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {departments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                    Отделов нет
                                </td>
                            </tr>
                        ) : departments.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    {d.code && d.short_name ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 font-mono whitespace-nowrap">
                                            {d.code}-{d.short_name}
                                        </span>
                                    ) : (
                                        <span className="text-gray-300 text-xs">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                                    {d.short_name ?? "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-800">{d.name}</td>
                                <td className="px-4 py-3 text-gray-500">{d.manager ?? "—"}</td>
                                <td className="px-4 py-3 text-gray-500">{d.users_count}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route("hr.departments.edit", d.id)} className="text-blue-600 hover:underline text-xs">
                                        Изменить
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
