import { Head, Link, useForm } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

const ROLES = [
    { value: "employee", label: "Сотрудник" },
    { value: "manager",  label: "Руководитель" },
    { value: "hr_admin", label: "HR-администратор" },
    { value: "admin",    label: "Администратор" },
];

export default function UserForm({ user, departments, managers }) {
    const isEdit = !!user;

    const { data, setData, post, put, processing, errors } = useForm({
        last_name:             user?.last_name     ?? "",
        first_name:            user?.first_name    ?? "",
        middle_name:           user?.middle_name   ?? "",
        role:                  user?.role          ?? "employee",
        phone:                 user?.phone         ?? "",
        email:                 user?.email         ?? "",
        department_id:         user?.department_id ?? "",
        position_id:           user?.position_id   ?? "",
        manager_id:            user?.manager_id    ?? "",
        hired_at:              user?.hired_at      ?? "",
        must_change_password:  true,
    });

    const availablePositions = departments
        .find((d) => d.id === Number(data.department_id))
        ?.positions ?? [];

    function submit(e) {
        e.preventDefault();
        if (isEdit) {
            put(route("admin.users.update", user.id));
        } else {
            post(route("admin.users.store"));
        }
    }

    return (
        <AppLayout title={isEdit ? "Редактировать сотрудника" : "Добавить сотрудника"}>
            <Head title={isEdit ? "Редактировать сотрудника" : "Добавить сотрудника"} />

            <div className="max-w-2xl">
                <p className="text-xs text-gray-400 mb-6">
                    <Link href={route("admin.users.index")} className="hover:underline">
                        ← Сотрудники
                    </Link>
                </p>

                <form onSubmit={submit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
                    {/* ФИО */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { field: "last_name",   label: "Фамилия *" },
                            { field: "first_name",  label: "Имя *" },
                            { field: "middle_name", label: "Отчество" },
                        ].map(({ field, label }) => (
                            <div key={field}>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                                <input
                                    value={data[field]}
                                    onChange={(e) => setData(field, e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                        errors[field] ? "border-red-300" : "border-gray-200"
                                    }`}
                                />
                                {errors[field] && <p className="mt-1 text-xs text-red-600">{errors[field]}</p>}
                            </div>
                        ))}
                    </div>

                    {/* Роль */}
                    {!isEdit && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Роль *</label>
                            <select
                                value={data.role}
                                onChange={(e) => setData("role", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Контакты */}
                    {data.role === "employee" && (
                        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                            Укажите телефон <strong>или</strong> email — хотя бы одно обязательно. Это будет использоваться для входа в систему.
                        </p>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Телефон {data.role === "employee" ? "*" : ""}
                            </label>
                            <input
                                value={data.phone}
                                onChange={(e) => setData("phone", e.target.value)}
                                placeholder="+77001234567"
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.phone ? "border-red-300" : "border-gray-200"
                                }`}
                            />
                            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email *
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.email ? "border-red-300" : "border-gray-200"
                                }`}
                            />
                            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                        </div>
                    </div>

                    {/* Отдел и должность */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Отдел</label>
                            <select
                                value={data.department_id}
                                onChange={(e) => {
                                    setData("department_id", e.target.value);
                                    setData("position_id", "");
                                }}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Выберите отдел —</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Должность</label>
                            <select
                                value={data.position_id}
                                onChange={(e) => setData("position_id", e.target.value)}
                                disabled={!data.department_id}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                            >
                                <option value="">— Выберите должность —</option>
                                {availablePositions.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Руководитель и дата приёма */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Руководитель</label>
                            <select
                                value={data.manager_id}
                                onChange={(e) => setData("manager_id", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">— Без руководителя —</option>
                                {managers.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.last_name} {m.first_name} {m.middle_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Дата приёма</label>
                            <input
                                type="date"
                                value={data.hired_at}
                                onChange={(e) => setData("hired_at", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {!isEdit && (
                        <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={data.must_change_password}
                                onChange={(e) => setData("must_change_password", e.target.checked)}
                                className="w-4 h-4 accent-blue-600"
                            />
                            Потребовать смену пароля при первом входе
                        </label>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {processing ? "Сохраняем..." : isEdit ? "Сохранить" : "Добавить"}
                        </button>
                        <Link
                            href={isEdit ? route("admin.users.show", user.id) : route("admin.users.index")}
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
