import { Head, Link } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

export default function TestsIndex({ tests }) {
    return (
        <AppLayout title="Тесты">
            <Head title="Тесты" />

            <div className="flex justify-end mb-6">
                <Link
                    href={route("admin.tests.create")}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    + Создать тест
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Название</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Документ</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Вопросов</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Порог</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Статус</th>
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
