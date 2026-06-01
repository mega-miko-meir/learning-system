import { Head, Link, router } from "@inertiajs/react";
import { useRef, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

let _id = 0;
const uid = () => ++_id;

function mkAnswer(text = "", is_correct = false) {
    return { _id: uid(), text, is_correct };
}

function mkQuestion() {
    return { _id: uid(), text: "", type: "single", answers: [mkAnswer(), mkAnswer()] };
}

function initFromTest(test) {
    return (test?.questions ?? []).map((q) => ({
        _id: uid(),
        text: q.text,
        type: q.type,
        answers: (q.answers ?? []).map((a) => ({
            _id: uid(),
            text: a.text,
            is_correct: a.is_correct,
        })),
    }));
}

// ── Карточка вопроса ────────────────────────────────────────────────
function QuestionCard({ q, index, onChange, onRemove, hasError }) {
    function setAnswerCorrect(aId) {
        const updated = q.answers.map((a) =>
            q.type === "multiple"
                ? a._id === aId ? { ...a, is_correct: !a.is_correct } : a
                : { ...a, is_correct: a._id === aId }
        );
        onChange({ ...q, answers: updated });
    }

    function updateAnswerText(aId, text) {
        onChange({ ...q, answers: q.answers.map((a) => a._id === aId ? { ...a, text } : a) });
    }

    function addAnswer() {
        onChange({ ...q, answers: [...q.answers, mkAnswer()] });
    }

    function removeAnswer(aId) {
        onChange({ ...q, answers: q.answers.filter((a) => a._id !== aId) });
    }

    function setType(type) {
        const answers = type === "single"
            ? q.answers.map((a, i) => ({ ...a, is_correct: i === 0 ? q.answers.some(a => a.is_correct) && a.is_correct : false }))
            : q.answers;
        onChange({ ...q, type, answers });
    }

    const hasCorrect = q.answers.some((a) => a.is_correct);

    return (
        <div className={`bg-white rounded-xl border overflow-hidden ${hasError && !hasCorrect ? "border-red-300" : "border-gray-200"}`}>
            {/* Шапка вопроса */}
            <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-100">
                <span className="text-sm font-bold text-gray-400 shrink-0 w-6 text-right">
                    {index + 1}.
                </span>
                <textarea
                    value={q.text}
                    onChange={(e) => onChange({ ...q, text: e.target.value })}
                    placeholder="Введите текст вопроса..."
                    rows={2}
                    className="flex-1 text-sm text-gray-900 bg-transparent resize-none outline-none placeholder-gray-300 font-medium"
                />
                <button
                    onClick={onRemove}
                    title="Удалить вопрос"
                    className="shrink-0 p-1.5 text-gray-300 hover:text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a2 2 0 00-2-2H9a2 2 0 00-2 2m10 0H5" />
                    </svg>
                </button>
            </div>

            {/* Тип + ошибка */}
            <div className="px-5 py-2 flex items-center gap-4 border-b border-gray-100 bg-gray-50/60">
                {["single", "multiple"].map((t) => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500">
                        <input
                            type="radio"
                            name={`type_${q._id}`}
                            checked={q.type === t}
                            onChange={() => setType(t)}
                            className="accent-blue-600"
                        />
                        {t === "single" ? "Один ответ" : "Несколько ответов"}
                    </label>
                ))}
                {hasError && !hasCorrect && (
                    <span className="ml-auto text-xs text-red-600 font-medium">
                        ⚠ Укажите правильный ответ
                    </span>
                )}
            </div>

            {/* Варианты ответа */}
            <div className="px-5 py-3 space-y-2">
                {q.answers.map((a) => (
                    <div key={a._id} className="flex items-center gap-3 group">
                        <button
                            type="button"
                            onClick={() => setAnswerCorrect(a._id)}
                            title={a.is_correct ? "Верный ответ" : "Отметить как верный"}
                            className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                a.is_correct
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-gray-300 hover:border-green-400"
                            }`}
                        >
                            {a.is_correct && (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>

                        <input
                            type="text"
                            value={a.text}
                            onChange={(e) => updateAnswerText(a._id, e.target.value)}
                            placeholder="Вариант ответа..."
                            className={`flex-1 text-sm px-3 py-1.5 rounded-lg border outline-none transition-colors ${
                                a.is_correct
                                    ? "border-green-300 bg-green-50 text-green-800"
                                    : "border-gray-200 focus:border-blue-400 bg-white"
                            }`}
                        />

                        <button
                            type="button"
                            onClick={() => removeAnswer(a._id)}
                            className="shrink-0 text-gray-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={addAnswer}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 pt-1"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Добавить вариант
                </button>
            </div>
        </div>
    );
}

// ── Главная форма ───────────────────────────────────────────────────
export default function TestCreate({ documents, document_id, test }) {
    const isEdit = !!test;

    const [title, setTitle]               = useState(test?.title ?? "");
    const [docId, setDocId]               = useState(test?.document_id ? String(test.document_id) : (document_id ?? ""));
    const [passingScore, setPassingScore] = useState(test?.passing_score ?? 70);
    const [timeLimit, setTimeLimit]       = useState(test?.time_limit ?? "");
    const [maxAttempts, setMaxAttempts]   = useState(test?.max_attempts ?? 3);
    const [isActive, setIsActive]         = useState(test?.is_active ?? true);
    const [questions, setQuestions]       = useState(isEdit ? initFromTest(test) : [mkQuestion()]);
    const [submitting, setSubmitting]       = useState(false);
    const [errors, setErrors]               = useState({});
    const [validated, setValidated]         = useState(false);
    const [importing, setImporting]         = useState(false);
    const [importError, setImportError]     = useState(null);
    const [replaceConfirm, setReplaceConfirm] = useState(null); // { testTitle }
    const fileInputRef                      = useRef(null);

    function updateQuestion(id, updated) {
        setQuestions((qs) => qs.map((q) => q._id === id ? updated : q));
    }

    function removeQuestion(id) {
        setQuestions((qs) => qs.filter((q) => q._id !== id));
    }

    function addQuestion() {
        setQuestions((qs) => [...qs, mkQuestion()]);
    }

    async function handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        const hasQuestions = questions.some(q => q.text.trim());
        if (hasQuestions && !confirm('Импортированные вопросы заменят текущие. Продолжить?')) return;

        setImporting(true);
        setImportError(null);

        const formData = new FormData();
        formData.append('file', file);
        const token = document.querySelector('meta[name="csrf-token"]')?.content;

        try {
            const res  = await fetch(route('admin.tests.parse-pdf'), {
                method:  'POST',
                headers: { 'X-CSRF-TOKEN': token, 'Accept': 'application/json' },
                body:    formData,
            });
            const data = await res.json();

            if (!res.ok) {
                setImportError(data.error ?? 'Ошибка при разборе файла.');
                return;
            }

            if (data.title) setTitle(data.title);
            setQuestions(data.questions.map(q => ({
                _id:     uid(),
                text:    q.text,
                type:    q.type,
                answers: q.answers.map(a => ({ _id: uid(), text: a.text, is_correct: a.is_correct })),
            })));
        } catch {
            setImportError('Не удалось загрузить файл. Проверьте соединение.');
        } finally {
            setImporting(false);
        }
    }

    function validate() {
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.text.trim()) return `Вопрос ${i + 1}: введите текст вопроса.`;
            if (!q.answers.some((a) => a.is_correct)) return `Вопрос ${i + 1}: укажите правильный вариант ответа.`;
            const filledAnswers = q.answers.filter((a) => a.text.trim());
            if (filledAnswers.length < 2) return `Вопрос ${i + 1}: добавьте минимум 2 варианта ответа.`;
        }
        return null;
    }

    function buildPayload(forceReplace = false) {
        return {
            title,
            document_id:   docId || null,
            passing_score: passingScore,
            time_limit:    timeLimit || null,
            max_attempts:  maxAttempts,
            is_active:     isActive,
            force_replace: forceReplace,
            questions:     questions.map((q, qi) => ({
                text:    q.text,
                type:    q.type,
                order:   qi + 1,
                answers: q.answers
                    .filter((a) => a.text.trim())
                    .map((a, ai) => ({
                        text:       a.text,
                        is_correct: a.is_correct,
                        order:      ai + 1,
                    })),
            })),
        };
    }

    function handleErrors(e) {
        if (e.document_conflict) {
            setReplaceConfirm({ testTitle: e.document_conflict });
            setSubmitting(false);
            return;
        }
        setErrors(e);
        setSubmitting(false);
    }

    function submitPayload(forceReplace = false) {
        setSubmitting(true);
        setErrors({});
        const payload = buildPayload(forceReplace);
        if (isEdit) {
            router.put(route("admin.tests.update", test.id), payload, {
                onError:  handleErrors,
                onFinish: () => setSubmitting(false),
            });
        } else {
            router.post(route("admin.tests.store"), payload, {
                onError:  handleErrors,
                onFinish: () => setSubmitting(false),
            });
        }
    }

    function submit(e) {
        e.preventDefault();
        setValidated(true);
        const err = validate();
        if (err) { alert(err); return; }
        submitPayload(false);
    }

    function confirmReplace() {
        setReplaceConfirm(null);
        submitPayload(true);
    }

    return (
        <AppLayout title={isEdit ? "Редактировать тест" : "Создать тест"}>
            <Head title={isEdit ? "Редактировать тест" : "Создать тест"} />

            <div className="mb-6">
                <p className="text-xs text-gray-400">
                    <Link href={isEdit ? route("admin.tests.show", test.id) : route("admin.tests.index")}
                        className="hover:underline">
                        ← {isEdit ? "К тесту" : "Тесты"}
                    </Link>
                </p>
            </div>

            <form onSubmit={submit} className="space-y-6 max-w-2xl">

                {/* ── Настройки ── */}
                <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700">Настройки теста</h2>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Название <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Например: Техника безопасности на складе"
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.title ? "border-red-300" : "border-gray-200"
                            }`}
                        />
                        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Документ
                            <span className="text-gray-400 font-normal ml-1">(необязательно)</span>
                        </label>
                        <select
                            value={docId}
                            onChange={(e) => setDocId(e.target.value)}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                                errors.document_id ? "border-red-300" : "border-gray-200"
                            }`}
                        >
                            <option value="">— Без документа —</option>
                            {documents.map((d) => (
                                <option key={d.id} value={d.id}>{d.title}</option>
                            ))}
                        </select>
                        {errors.document_id && <p className="mt-1 text-xs text-red-600">{errors.document_id}</p>}
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Порог сдачи (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number" min={1} max={100}
                                value={passingScore}
                                onChange={(e) => setPassingScore(+e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Лимит времени (мин)</label>
                            <input
                                type="number" min={1}
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(e.target.value)}
                                placeholder="Без ограничения"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Попыток</label>
                            <input
                                type="number" min={1} max={10}
                                value={maxAttempts}
                                onChange={(e) => setMaxAttempts(+e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {isEdit && (
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 accent-blue-600"
                            />
                            <span className="text-sm text-gray-700">Тест активен</span>
                        </label>
                    )}
                </div>

                {/* ── Вопросы ── */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-700">
                            Вопросы <span className="text-gray-400 font-normal">({questions.length})</span>
                        </h3>
                        <div className="flex items-center gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                className="hidden"
                                onChange={handleImport}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                disabled={importing}
                                title="Импортировать вопросы из PDF-файла"
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                {importing ? 'Загрузка...' : 'Импорт из PDF'}
                            </button>
                        </div>
                    </div>

                    {importError && (
                        <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            </svg>
                            <span>{importError}</span>
                        </div>
                    )}

                    <details className="group">
                        <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 select-none list-none flex items-center gap-1">
                            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            Формат PDF-шаблона
                        </summary>
                        <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 overflow-x-auto leading-relaxed">{`Название теста

1. Текст вопроса с одним ответом?
a) Вариант А
b) Вариант Б *
c) Вариант В

2. Вопрос с несколькими ответами? [multiple]
a) Вариант А *
b) Вариант Б *
c) Вариант В
d) Вариант Г`}</pre>
                        <p className="mt-1.5 text-xs text-gray-400">
                            Первая строка → название теста &nbsp;·&nbsp;
                            <span className="font-medium text-gray-500">*</span> — правильный ответ &nbsp;·&nbsp;
                            <span className="font-medium text-gray-500">[multiple]</span> — несколько правильных ответов
                        </p>
                    </details>

                    {questions.map((q, i) => (
                        <QuestionCard
                            key={q._id}
                            q={q}
                            index={i}
                            onChange={(updated) => updateQuestion(q._id, updated)}
                            onRemove={() => removeQuestion(q._id)}
                            hasError={validated}
                        />
                    ))}

                    <button
                        type="button"
                        onClick={addQuestion}
                        className="w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 text-sm rounded-xl hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Добавить вопрос
                    </button>
                </div>

                {/* ── Кнопки ── */}
                <div className="flex gap-3 pb-8">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50"
                    >
                        {submitting ? "Сохраняем..." : isEdit ? "Сохранить изменения" : "Сохранить тест"}
                    </button>
                    <Link
                        href={isEdit ? route("admin.tests.show", test.id) : route("admin.tests.index")}
                        className="px-6 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
                    >
                        Отмена
                    </Link>
                </div>
            </form>
            {replaceConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-1">Документ уже имеет тест</h3>
                                <p className="text-sm text-gray-600">
                                    К этому документу уже прикреплён тест{' '}
                                    <span className="font-medium text-gray-800">«{replaceConfirm.testTitle}»</span>.
                                    Хотите открепить его и прикрепить текущий?
                                </p>
                                <p className="mt-1.5 text-xs text-gray-400">Старый тест не удалится — он просто останется без документа.</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => setReplaceConfirm(null)}
                                className="px-4 py-2 text-sm border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
                            >
                                Отмена
                            </button>
                            <button
                                type="button"
                                onClick={confirmReplace}
                                className="px-4 py-2 text-sm bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600"
                            >
                                Заменить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
