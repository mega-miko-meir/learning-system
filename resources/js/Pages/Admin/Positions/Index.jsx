import { Head, Link } from "@inertiajs/react";
import { useState, useMemo } from "react";
import AppLayout from "../../../Layouts/AppLayout";

export default function PositionsIndex({ positions, departments }) {
    const [departmentId, setDepartmentId] = useState("");

    const filtered = useMemo(() =>
        departmentId
            ? positions.filter((p) => p.department_id === Number(departmentId))
            : positions,
        [departmentId, positions]
    );

    return (
        <AppLayout title="Должности">
            <Head title="Должности" />

            <div className="flex items-center gap-3 mb-6">
                <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Все отделы</option>
                    {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>

                <span className="text-sm text-gray-400">{filtered.length} должностей</span>

                <Link href={route("admin.positions.create")}
                    className="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                    + Добавить должность
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Должность</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Отдел</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                                    {departmentId ? "В этом отделе нет должностей" : "Должностей нет"}
                                </td>
                            </tr>
                        ) : filtered.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                                <td className="px-4 py-3 text-gray-500">{p.department ?? "—"}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                        {p.is_active ? "Активна" : "Неактивна"}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={route("admin.positions.edit", p.id)}
                                        className="text-blue-600 hover:underline text-xs">
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
