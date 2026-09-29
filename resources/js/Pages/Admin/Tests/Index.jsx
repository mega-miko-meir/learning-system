import { Head, Link, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

function SortIcon({ direction }) {
    return (
        <svg
            className={`w-3 h-3 shrink-0 transition-transform ${direction === "desc" ? "rotate-180" : ""} ${direction ? "text-gray-700" : "text-gray-300"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 15l4 4 4-4M8 9l4-4 4 4" />
        </svg>
    );
}

const SORTABLE_COLUMNS = {
    title:            { label: "Название" },
    document:         { label: "Документ" },
    questions_count:  { label: "Вопросов" },
    passing_score:    { label: "Порог" },
    is_active:        { label: "Статус" },
};

export default function TestsIndex({ tests }) {
    const params = Object.fromEntries(new URLSearchParams(window.location.search));
    const [search, setSearch] = useState(params.search ?? "");

    function doSearch(e) {
        e.preventDefault();
        router.get(route("admin.tests.index"), { ...params, search: search || undefined }, {
            preserveState: true, replace: true,
        });
    }

    // Сортировка серверная (по всем тестам, не только по текущей странице), без перезагрузки
    // страницы — обычный Inertia-запрос с сохранением состояния.
    function toggleSort(key) {
        const dir = params.sort === key && params.dir === "asc" ? "desc" : "asc";
        router.get(route("admin.tests.index"), { ...params, sort: key, dir }, {
            preserveState: true, replace: true,
        });
    }

    return (
        <AppLayout title="Тесты">
            <Head title="Тесты" />

            <div className="flex flex-wrap items-center gap-3 mb-6">
                <p className="text-sm text-gray-500">Тестов: {tests.total}</p>

                <form onSubmit={doSearch} className="flex gap-2">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по названию или документу..."
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                    <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-gray-300">
                        Найти
                    </button>
                </form>

                <Link
                    href={route("admin.tests.create")}
                    className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    + Создать тест
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            {Object.entries(SORTABLE_COLUMNS).map(([key, { label }]) => (
                                <th key={key} className="text-left px-4 py-3 font-medium text-gray-600">
                                    <button
                                        type="button"
                                        onClick={() => toggleSort(key)}
                                        className="flex items-center gap-1 hover:text-gray-900"
                                    >
                                        {label}
                                        <SortIcon direction={params.sort === key ? (params.dir === "desc" ? "desc" : "asc") : null} />
                                    </button>
                                </th>
                            ))}
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tests.data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                                    Тестов нет
                                </td>
                            </tr>
                        ) : (
                            tests.data.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{t.title}</td>
                                    <td className="px-4 py-3 text-gray-500">{t.document ?? "—"}</td>
                                    <td className="px-4 py-3 text-gray-500">{t.questions_count}</td>
                                    <td className="px-4 py-3 text-gray-500">{t.passing_score}%</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            t.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                                        }`}>
                                            {t.is_active ? "Активен" : "Неактивен"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link href={route("admin.tests.show", t.id)} className="text-blue-600 hover:underline text-xs">
                                            Открыть
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination links={tests.links} />
        </AppLayout>
    );
}
