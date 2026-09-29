import { Head, Link, useForm, usePage, router } from "@inertiajs/react";
import { useRef, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

export default function DocumentShow({ document: doc, test, availableTests = [] }) {
    // Первичный инструктаж без теста включается флагом FEATURE_INDUCTION (config/features.php)
    const inductionEnabled = !!usePage().props.features?.induction;
    const isConfirmation = inductionEnabled && doc.completion_mode === "confirmation";
    const fileRef = useRef(null);
    const { data, setData, post, processing, errors } = useForm({ file: null });

    const [selectedTestId, setSelectedTestId] = useState("");
    const [attaching, setAttaching] = useState(false);
    const [testConflict, setTestConflict] = useState(null); // { testTitle }

    function attachExistingTest(forceReplace = false) {
        if (!selectedTestId) return;
        setAttaching(true);
        router.post(
            route("admin.documents.attach-test", doc.id),
            { test_id: selectedTestId, force_replace: forceReplace },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedTestId("");
                    setTestConflict(null);
                },
                onError: (e) => {
                    if (e.test_conflict) {
                        setTestConflict({ testTitle: e.test_conflict });
                    }
                },
                onFinish: () => setAttaching(false),
            }
        );
    }

    function confirmReplaceTest() {
        setTestConflict(null);
        attachExistingTest(true);
    }

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
                            {inductionEnabled && (
                                <div>
                                    <dt className="text-gray-400 text-xs">Способ завершения</dt>
                                    <dd className="text-gray-700">
                                        {isConfirmation ? "Без теста (ознакомление)" : "Чтение и тест"}
                                    </dd>
                                </div>
                            )}
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
                    {!isConfirmation && (
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3">Тест</h2>
                        {test ? (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-700 font-medium">{test.title}</p>
                                <Link
                                    href={route("admin.tests.show", test.id) + `?return_to=${doc.id}`}
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
                                {availableTests.length > 0 && (
                                    <div className="space-y-1.5">
                                        <select
                                            value={selectedTestId}
                                            onChange={(e) => setSelectedTestId(e.target.value)}
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700"
                                        >
                                            <option value="">Выбрать существующий тест…</option>
                                            {availableTests.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.title}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => attachExistingTest(false)}
                                            disabled={!selectedTestId || attaching}
                                            className="w-full px-4 py-2 text-sm border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                                        >
                                            {attaching ? "Привязываем..." : "Привязать выбранный тест"}
                                        </button>
                                    </div>
                                )}
                                <Link
                                    href={route("admin.tests.create") + `?document_id=${doc.id}`}
                                    className="inline-block w-full text-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    + Создать тест
                                </Link>
                            </div>
                        )}
                    </div>
                    )}

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

            {testConflict && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Тест уже привязан к другому документу</h3>
                                <p className="text-sm text-gray-600">
                                    Тест <span className="font-medium text-gray-800">«{testConflict.testTitle}»</span>{' '}
                                    сейчас привязан к другому документу. Хотите открепить его оттуда и привязать к этому документу?
                                </p>
                                <p className="mt-1.5 text-xs text-gray-400">Тест не удалится — он просто останется без прежнего документа.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setTestConflict(null)}
                                className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                onClick={confirmReplaceTest}
                                className="px-4 py-2 text-sm bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600"
                            >
                                Открепить и привязать
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
