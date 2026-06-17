import { Head, Link, useForm, router } from "@inertiajs/react";
import { useRef } from "react";
import AppLayout from "../../../Layouts/AppLayout";

export default function DocumentShow({ document: doc, test }) {
    const fileRef = useRef(null);
    const { data, setData, post, processing, errors } = useForm({ file: null });

    function uploadNewVersion(e) {
        e.preventDefault();
        post(route("admin.documents.new-version", doc.id), { forceFormData: true });
    }

    function deactivate() {
        if (confirm(`Деактивировать документ «${doc.display_name}»?`)) {
            router.delete(route("admin.documents.destroy", doc.id));
        }
    }

    function deleteDocument() {
        if (confirm(`Удалить документ «${doc.display_name}» навсегда?\n\nБудут удалены: тест, вопросы, назначения обучения и все результаты тестов. Это действие нельзя отменить.`)) {
            router.delete(route("admin.documents.force-delete", doc.id));
        }
    }

    return (
        <AppLayout title={doc.display_name}>
            <Head title={doc.display_name} />

            <p className="text-xs text-gray-400 mb-6">
                <Link href={route("admin.documents.index")} className="hover:underline">
                    ← Документы
                </Link>
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Левая колонка — инфо */}
                <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-4">Информация</h2>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-gray-400 text-xs">Тип документа</dt>
                                <dd className="text-gray-700">{doc.type}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 text-xs">Код документа</dt>
                                <dd className="text-gray-900 font-medium">{doc.title}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 text-xs">Название документа</dt>
                                <dd className="text-gray-900 font-medium">{doc.description}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 text-xs">Версия</dt>
                                <dd className="text-gray-700 font-mono">v{doc.version}</dd>
                            </div>
                            <div>
                                <dt className="text-gray-400 text-xs">Статус</dt>
                                <dd>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        doc.is_active
                                            ? "bg-green-50 text-green-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}>
                                        {doc.is_active ? "Активен" : "Неактивен"}
                                    </span>
                                </dd>
                            </div>
                        </dl>

                        <div className="mt-5 flex flex-col gap-2">
                            <Link
                                href={route("admin.documents.edit", doc.id)}
                                className="w-full text-center px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                                Редактировать
                            </Link>
                            {doc.is_active && (
                                <button
                                    onClick={deactivate}
                                    className="w-full px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                                >
                                    Деактивировать
                                </button>
                            )}
                            <button
                                onClick={deleteDocument}
                                className="w-full px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                            >
                                Удалить навсегда
                            </button>
                        </div>
                    </div>

                    {/* Тест к документу */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Тест</h2>
                        {test ? (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-700 font-medium">{test.title}</p>
                                <Link
                                    href={route("admin.tests.show", test.id)}
                                    className="inline-block w-full text-center px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                    Управлять тестом
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
                                    Тест не добавлен
                                </p>
                                <Link
                                    href={route("admin.tests.create") + `?document_id=${doc.id}`}
                                    className="inline-block w-full text-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    + Создать тест
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Загрузка новой версии */}
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">
                            Загрузить новую версию
                        </h2>
                        <p className="text-xs text-gray-400 mb-3">
                            После загрузки всем сотрудникам, у которых этот документ в матрице,
                            будет назначено повторное обучение.
                        </p>
                        <form onSubmit={uploadNewVersion} className="space-y-3">
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setData("file", e.target.files[0])}
                                className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs"
                            />
                            {errors.file && (
                                <p className="text-xs text-red-600">{errors.file}</p>
                            )}
                            <button
                                type="submit"
                                disabled={processing || !data.file}
                                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {processing ? "Загружаем..." : `Загрузить v${doc.version + 1}`}
                            </button>
                        </form>
                    </div>
                </div>

                {/* PDF-просмотр */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden"
                     style={{ height: "calc(100vh - 200px)" }}>
                    <iframe
                        src={route("documents.view", doc.id)}
                        title={doc.display_name}
                        className="w-full h-full border-0"
                    />
                </div>
            </div>
        </AppLayout>
    );
}
