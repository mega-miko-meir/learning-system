import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

export default function DepartmentForm({ department }) {
    const isEdit = !!department;
    const { data, setData, post, put, processing, errors } = useForm({
        name:      department?.name      ?? "",
        is_active: department?.is_active ?? true,
    });

    function submit(e) {
        e.preventDefault();
        isEdit ? put(route("admin.departments.update", department.id))
               : post(route("admin.departments.store"));
    }

    return (
        <AppLayout title={isEdit ? "Редактировать отдел" : "Добавить отдел"}>
            <Head title={isEdit ? "Редактировать отдел" : "Добавить отдел"} />
            <div className="max-w-md">
                <p className="text-xs text-gray-400 mb-6">
                    <Link href={route("admin.departments.index")} className="hover:underline">← Отделы</Link>
                </p>
                <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Название *</label>
                        <input
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? "border-red-300" : "border-gray-200"}`}
                        />
                        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                    </div>
                    {isEdit && (
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={data.is_active}
                                onChange={(e) => setData("is_active", e.target.checked)}
                                className="w-4 h-4 accent-blue-600" />
                            Активен
                        </label>
                    )}
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing}
                            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {processing ? "Сохраняем..." : isEdit ? "Сохранить" : "Создать"}
                        </button>
                        <Link href={route("admin.departments.index")}
                            className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                            Отмена
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
