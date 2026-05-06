import { Head, Link } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

export default function DepartmentsIndex({ departments }) {
    return (
        <AppLayout title="Отделы">
            <Head title="Отделы" />
            <div className="flex justify-end mb-6">
                <Link href={route("admin.departments.create")}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    + Добавить отдел
                </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Сотрудников</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {departments.data.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Отделов нет</td></tr>
                        ) : departments.data.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                                <td className="px-4 py-3 text-gray-500">{d.users_count}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${d.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                        {d.is_active ? "Активен" : "Неактивен"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route("admin.departments.edit", d.id)} className="text-blue-600 hover:underline text-xs">
                                        Изменить
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination links={departments.links} />
        </AppLayout>
    );
}
