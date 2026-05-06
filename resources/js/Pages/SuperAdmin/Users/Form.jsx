import { Head, Link, useForm } from "@inertiajs/react";
import AppLayout from "../../../Layouts/AppLayout";

const ROLES = [
    { value: "superadmin", label: "Системный администратор" },
    { value: "admin",      label: "Администратор (ОКК)" },
    { value: "hr_admin",   label: "HR-администратор" },
    { value: "manager",    label: "Руководитель" },
    { value: "employee",   label: "Сотрудник" },
];

export default function SuperAdminUserForm({ departments }) {
    const { data, setData, post, processing, errors } = useForm({
        last_name:     "",
        first_name:    "",
        middle_name:   "",
        role:          "admin",
        email:         "",
        phone:         "",
        department_id: "",
        position_id:   "",
        password:      "",
    });

    const availablePositions = departments
        .find((d) => d.id === Number(data.department_id))
        ?.positions ?? [];

    function submit(e) {
        e.preventDefault();
        post(route("superadmin.users.store"));
    }

    return (
        <AppLayout title="Добавить пользователя">
            <Head title="Добавить пользователя" />

            <div className="max-w-2xl">
                <p className="text-xs text-gray-400 mb-6">
                    <Link href={route("superadmin.users.index")} className="hover:underline">
                        ← Пользователи и роли
                    </Link>
                </p>

                <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                    <h2 className="text-sm font-semibold text-gray-700">Новый пользователь системы</h2>

                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { field: "last_name",   label: "Фамилия *" },
                            { field: "first_name",  label: "Имя *" },
                            { field: "middle_name", label: "Отчество" },
                        ].map(({ field, label }) => (
                            <div key={field}>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                                <input value={data[field]} onChange={(e) => setData(field, e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors[field] ? "border-red-300" : "border-gray-200"}`} />
                                {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Роль */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Роль *</label>
                        <select value={data.role} onChange={(e) => setData("role", e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        {data.role === "superadmin" && (
                            <p className="mt-1 text-xs text-purple-600">
                                ⚠ Суперадмин имеет полный доступ ко всем функциям системы.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email {data.role !== "employee" ? "*" : ""}
                            </label>
                            <input type="email" value={data.email} onChange={(e) => setData("email", e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.email ? "border-red-300" : "border-gray-200"}`} />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Телефон {data.role === "employee" ? "*" : ""}
                            </label>
                            <input value={data.phone} onChange={(e) => setData("phone", e.target.value)}
                                placeholder="+77001234567"
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.phone ? "border-red-300" : "border-gray-200"}`} />
                            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                        </div>
                    </div>

                    {/* Пароль */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Пароль *</label>
                        <input type="password" value={data.password} onChange={(e) => setData("password", e.target.value)}
                            placeholder="Минимум 8 символов"
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${errors.password ? "border-red-300" : "border-gray-200"}`} />
                        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Отдел</label>
                            <select value={data.department_id}
                                onChange={(e) => { setData("department_id", e.target.value); setData("position_id", ""); }}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                                <option value="">— Без отдела —</option>
                                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Должность</label>
                            <select value={data.position_id} onChange={(e) => setData("position_id", e.target.value)}
                                disabled={!data.department_id}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50 disabled:text-gray-400">
                                <option value="">— Без должности —</option>
                                {availablePositions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={processing}
                            className="px-5 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50">
                            {processing ? "Создаём..." : "Создать пользователя"}
                        </button>
                        <Link href={route("superadmin.users.index")}
                            className="px-5 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                            Отмена
                        </Link>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
