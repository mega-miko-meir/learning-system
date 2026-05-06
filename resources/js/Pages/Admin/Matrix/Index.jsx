import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

function ApplyMatrixButton() {
    const [loading, setLoading] = useState(false);
    function apply() {
        if (!confirm("Назначить все документы из матрицы текущим активным сотрудникам? Дубли пропускаются.")) return;
        setLoading(true);
        router.post(route("admin.matrix.apply-all"), {}, {
            onFinish: () => setLoading(false),
        });
    }
    return (
        <button onClick={apply} disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? "Применяем..." : "⚡ Применить матрицу к сотрудникам"}
        </button>
    );
}

const TRAINING_TYPES = [
    { value: "primary",  label: "Первичное" },
    { value: "periodic", label: "Периодическое" },
    { value: "unplanned", label: "Внеплановое" },
    { value: "special",  label: "Специальное" },
];

export default function MatrixIndex({ matrix, positions, documents }) {
    const [filterPos, setFilterPos] = useState("");
    const { data, setData, post, processing, errors, reset } = useForm({
        position_id:   "",
        document_id:   "",
        training_type: "primary",
        is_mandatory:  true,
    });

    function submit(e) {
        e.preventDefault();
        post(route("admin.matrix.store"), { onSuccess: reset });
    }

    function remove(id) {
        if (confirm("Удалить запись из матрицы?")) {
            router.delete(route("admin.matrix.destroy", id), { preserveScroll: true });
        }
    }

    const filtered = filterPos
        ? matrix.filter((m) => m.position === positions.find((p) => p.id === Number(filterPos))?.name)
        : matrix;

    // Группируем по отделу
    const grouped = filtered.reduce((acc, m) => {
        const key = m.department ?? "Без отдела";
        acc[key] = acc[key] ?? [];
        acc[key].push(m);
        return acc;
    }, {});

    return (
        <AppLayout title="Матрица обучения">
            <Head title="Матрица обучения" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Форма добавления */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-6">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Добавить запись</h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Должность *</label>
                                <select
                                    value={data.position_id}
                                    onChange={(e) => setData("position_id", e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.position_id ? "border-red-300" : "border-gray-200"}`}
                                >
                                    <option value="">— Выберите —</option>
                                    {positions.map((p) => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                {errors.position_id && <p className="mt-1 text-xs text-red-600">{errors.position_id}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Документ *</label>
                                <select
                                    value={data.document_id}
                                    onChange={(e) => setData("document_id", e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.document_id ? "border-red-300" : "border-gray-200"}`}
                                >
                                    <option value="">— Выберите —</option>
                                    {documents.map((d) => (
                                        <option key={d.id} value={d.id}>{d.title}</option>
                                    ))}
                                </select>
                                {errors.document_id && <p className="mt-1 text-xs text-red-600">{errors.document_id}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Вид обучения</label>
                                <select
                                    value={data.training_type}
                                    onChange={(e) => setData("training_type", e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {TRAINING_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={data.is_mandatory}
                                    onChange={(e) => setData("is_mandatory", e.target.checked)}
                                    className="w-4 h-4 accent-blue-600"
                                />
                                Обязательное
                            </label>

                            <button type="submit" disabled={processing}
                                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {processing ? "Добавляем..." : "Добавить"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Таблица */}
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-4">
                        <p className="text-sm text-gray-500">{matrix.length} записей</p>
                        <ApplyMatrixButton />
                        <select
                            value={filterPos}
                            onChange={(e) => setFilterPos(e.target.value)}
                            className="ml-auto px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Все должности</option>
                            {positions.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {Object.entries(grouped).map(([dept, rows]) => (
                        <div key={dept} className="mb-6">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                {dept}
                            </h3>
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="text-left px-4 py-2 font-medium text-gray-500">Должность</th>
                                            <th className="text-left px-4 py-2 font-medium text-gray-500">Документ</th>
                                            <th className="text-left px-4 py-2 font-medium text-gray-500">Вид</th>
                                            <th className="text-left px-4 py-2 font-medium text-gray-500">Обяз.</th>
                                            <th className="px-4 py-2" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {rows.map((m) => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2.5 text-gray-700">{m.position}</td>
                                                <td className="px-4 py-2.5 text-gray-600">{m.document}</td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-xs text-gray-500">
                                                        {TRAINING_TYPES.find((t) => t.value === m.training_type)?.label ?? m.training_type}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    {m.is_mandatory ? (
                                                        <span className="text-green-600 text-xs">✓</span>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-right">
                                                    <button
                                                        onClick={() => remove(m.id)}
                                                        className="text-xs text-red-400 hover:text-red-600"
                                                    >
                                                        Удалить
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                            <p className="text-gray-400 text-sm">Матрица пуста</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
