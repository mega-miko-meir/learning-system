import { Head, Link } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

export default function HRPositionsIndex({ positions }) {
    const [search, setSearch] = useState("");

    const filtered = search.trim()
        ? positions.filter(
              (p) =>
                  p.name.toLowerCase().includes(search.toLowerCase()) ||
                  (p.department ?? "").toLowerCase().includes(search.toLowerCase())
          )
        : positions;

    const groups = filtered.reduce((acc, p) => {
        const dept = p.department ?? "Без отдела";
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(p);
        return acc;
    }, {});

    return (
        <AppLayout title="Должности">
            <Head title="Должности" />

            <div className="flex flex-wrap gap-2 mb-6 items-center">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по должности или отделу..."
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
                />
                <a
                    href={route("hr.positions.export")}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Экспорт в Excel
                </a>

                <Link
                    href={route("hr.positions.create")}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    + Добавить должность
                </Link>
            </div>

            {Object.keys(groups).length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                    Должностей не найдено
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(groups).map(([dept, items]) => (
                        <div key={dept} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {dept}
                                </span>
                                <span className="ml-2 text-xs text-gray-400">{items.length} шт.</span>
                            </div>
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-50">
                                    {items.map((p) => (
                                        <tr key={p.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5 text-gray-800">{p.name}</td>
                                            <td className="px-4 py-2.5 text-right">
                                                <Link
                                                    href={route("hr.positions.edit", p.id)}
                                                    className="text-blue-600 hover:underline text-xs"
                                                >
                                                    Изменить
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}

            <p className="mt-4 text-xs text-gray-400">
                Всего должностей: {filtered.length}
            </p>
        </AppLayout>
    );
}
