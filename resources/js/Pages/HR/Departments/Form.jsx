import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

export default function HRDepartmentForm({ department, managers }) {
    const isEdit = !!department;
    const { data, setData, post, put, processing, errors } = useForm({
        name:       department?.name       ?? "",
        code:       department?.code       ?? "",
        short_name: department?.short_name ?? "",
        manager_id: department?.manager_id ?? "",
    });

    function submit(e) {
        e.preventDefault();
        isEdit ? put(route("hr.departments.update", department.id))
               : post(route("hr.departments.store"));
    }

    return (
        <AppLayout title={isEdit ? "Редактировать отдел" : "Добавить отдел"}>
            <Head title={isEdit ? "Редактировать отдел" : "Добавить отдел"} />
            <div className="max-w-md">
                <p className="text-xs text-gray-400 mb-6">
                    <Link href={route("hr.departments.index")} className="hover:underline">← Отделы</Link>
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Код подразделения</label>
                            <input
                                value={data.code}
                                onChange={(e) => setData("code", e.target.value)}
                                placeholder="15"
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.code ? "border-red-300" : "border-gray-200"}`}
                            />
                            {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Сокращённое название</label>
                            <input
                                value={data.short_name}
                                onChange={(e) => setData("short_name", e.target.value)}
                                placeholder="ООК"
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.short_name ? "border-red-300" : "border-gray-200"}`}
                            />
                            {errors.short_name && <p className="mt-1 text-xs text-red-600">{errors.short_name}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Руководитель</label>
                        <select value={data.manager_id} onChange={(e) => setData("manager_id", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">— Без руководителя —</option>
                            {managers.map((m) => (
                                <option key={m.id} value={m.id}>{m.last_name} {m.first_name} {m.middle_name}</option>
                            ))}
                        </select>
                        {errors.manager_id && <p className="mt-1 text-xs text-red-600">{errors.manager_id}</p>}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing}
                            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {processing ? "Сохраняем..." : isEdit ? "Сохранить" : "Создать"}
                        </button>
                        <Link href={route("hr.departments.index")}
                            className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                            Отмена
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
