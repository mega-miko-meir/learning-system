import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

export default function EmployeesIndex({ employees }) {
    const [search, setSearch] = useState(
        new URLSearchParams(window.location.search).get("search") ?? ""
    );

    function doSearch(e) {
        e.preventDefault();
        router.get(route("manager.employees"), search ? { search } : {}, {
            preserveState: true, replace: true,
        });
    }

    return (
        <AppLayout title="Мои сотрудники">
            <Head title="Мои сотрудники" />

            <form onSubmit={doSearch} className="flex gap-2 mb-6 max-w-sm">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по имени..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">Найти</button>
            </form>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">ФИО</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Отдел</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {employees.data.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Сотрудников нет</td></tr>
                        ) : employees.data.map((emp) => (
                            <tr key={emp.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{emp.full_name}</td>
                                <td className="px-4 py-3 text-gray-500">{emp.position ?? "—"}</td>
                                <td className="px-4 py-3 text-gray-400">{emp.department ?? "—"}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route("manager.employees.show", emp.id)}
                                        className="text-blue-600 hover:underline text-xs">
                                        Просмотр
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination links={employees.links} />
        </AppLayout>
    );
}
