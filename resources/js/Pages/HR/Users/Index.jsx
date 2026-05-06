import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

export default function HRUsersIndex({ users, departments }) {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    const [search, setSearch] = useState(params.search ?? "");

    function filter(key, value) {
        router.get(route("hr.users.index"), { ...params, [key]: value || undefined }, {
            preserveState: true, replace: true,
        });
    }

    function doSearch(e) {
        e.preventDefault();
        filter("search", search);
    }

    return (
        <AppLayout title="Сотрудники">
            <Head title="Сотрудники" />

            <div className="flex flex-wrap gap-2 mb-6 items-center">
                <form onSubmit={doSearch} className="flex gap-2">
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск..."
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
                    <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">Найти</button>
                </form>

                <select value={params.department_id ?? ""} onChange={(e) => filter("department_id", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Все отделы</option>
                    {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                <select value={params.status ?? ""} onChange={(e) => filter("status", e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Все статусы</option>
                    <option value="active">Активные</option>
                    <option value="inactive">Неактивные</option>
                </select>

                <Link href={route("hr.users.create")}
                    className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    + Добавить сотрудника
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">ФИО</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Телефон</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Отдел</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Принят</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.data.length === 0 ? (
                            <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Сотрудников не найдено</td></tr>
                        ) : users.data.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{u.full_name}</td>
                                <td className="px-4 py-3 text-gray-500">{u.phone ?? "—"}</td>
                                <td className="px-4 py-3 text-gray-500">{u.department ?? "—"}</td>
                                <td className="px-4 py-3 text-gray-500">{u.position ?? "—"}</td>
                                <td className="px-4 py-3 text-gray-400">{u.hired_at ?? "—"}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                                        {u.is_active ? "Активен" : "Неактивен"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route("hr.users.show", u.id)} className="text-blue-600 hover:underline text-xs">
                                        Открыть
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination links={users.links} />
        </AppLayout>
    );
}
