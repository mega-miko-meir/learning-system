import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

export default function DocumentsIndex({ documents }) {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    const [search, setSearch] = useState(params.search ?? "");

    function doSearch(e) {
        e.preventDefault();
        router.get(route("admin.documents.index"), { ...params, search: search || undefined }, {
            preserveState: true, replace: true,
        });
    }

    function toggleNoTest(e) {
        router.get(route("admin.documents.index"), {
            ...params,
            search: search || undefined,
            no_test: e.target.checked ? "1" : undefined,
        }, { preserveState: true, replace: true });
    }

    const filteringNoTest = params.no_test === "1";

    return (
        <AppLayout title="Документы">
            <Head title="Документы" />

            <div className="flex flex-wrap items-center gap-3 mb-6">
                <form onSubmit={doSearch} className="flex gap-2">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по названию..."
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                    />
                    <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-gray-300">
                        Найти
                    </button>
                </form>

                {/* Фильтр: без теста */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={filteringNoTest}
                        onChange={toggleNoTest}
                        className="accent-orange-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">Только без теста</span>
                    {filteringNoTest && (
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            фильтр активен
                        </span>
                    )}
                </label>

                <Link
                    href={route("admin.documents.create")}
                    className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    + Добавить документ
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Тип</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Версия</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Тест</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Добавлен</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {documents.data.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    Документов нет
                                </td>
                            </tr>
                        ) : (
                            documents.data.map((d) => (
                                <tr key={d.id} className={`hover:bg-gray-50 ${!d.has_test ? "bg-orange-50/40" : ""}`}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{d.title}</td>
                                    <td className="px-4 py-3 text-gray-500">{d.type}</td>
                                    <td className="px-4 py-3 text-gray-500">v{d.version}</td>
                                    <td className="px-4 py-3">
                                        {d.has_test ? (
                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                                Есть
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Нет теста
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-gray-400">{d.created_at}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            d.is_active
                                                ? "bg-green-50 text-green-700"
                                                : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {d.is_active ? "Активен" : "Неактивен"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={route("admin.documents.show", d.id)}
                                            className="text-blue-600 hover:underline text-xs"
                                        >
                                            Открыть
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination links={documents.links} />
        </AppLayout>
    );
}
