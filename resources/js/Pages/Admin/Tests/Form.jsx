import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

export default function TestForm({ test, documents }) {
    const isEdit = !!test;

    const { data, setData, post, put, processing, errors } = useForm({
        title:         test?.title         ?? "",
        document_id:   test?.document_id   ?? "",
        passing_score: test?.passing_score ?? 70,
        time_limit:    test?.time_limit    ?? "",
        description:   test?.description   ?? "",
        is_active:     test?.is_active     ?? true,
    });

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route("admin.tests.update", test.id));
        } else {
            post(route("admin.tests.store"));
        }
    }

    return (
        <AppLayout title={isEdit ? "Редактировать тест" : "Создать тест"}>
            <Head title={isEdit ? "Редактировать тест" : "Создать тест"} />

            <div className="max-w-xl">
                <p className="text-xs text-gray-400 mb-6">
                    <Link href={route("admin.tests.index")} className="hover:underline">← Тесты</Link>
                </p>

                <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Название *</label>
                        <input
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? "border-red-300" : "border-gray-200"}`}
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Связанный документ</label>
                        <select
                            value={data.document_id}
                            onChange={(e) => setData("document_id", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">— Без документа —</option>
                            {documents.map((d) => (
                                <option key={d.id} value={d.id}>{d.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Описание</label>
                        <textarea
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Порог сдачи (%) *
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={data.passing_score}
                                onChange={(e) => setData("passing_score", e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.passing_score ? "border-red-300" : "border-gray-200"}`}
                            />
                            {errors.passing_score && <p className="mt-1 text-xs text-red-600">{errors.passing_score}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Лимит времени (мин)
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={data.time_limit}
                                onChange={(e) => setData("time_limit", e.target.value)}
                                placeholder="Без ограничения"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {isEdit && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) => setData("is_active", e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                            />
                            <label htmlFor="is_active" className="text-sm text-gray-700">Активен</label>
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing}
                            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {processing ? "Сохраняем..." : isEdit ? "Сохранить" : "Создать"}
                        </button>
                        <Link
                            href={isEdit ? route("admin.tests.show", test.id) : route("admin.tests.index")}
                            className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                        >
                            Отмена
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
