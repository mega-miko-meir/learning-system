import { Head, Link, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

function QuestionCard({ question, testId, onDelete }) {
    const [addingAnswer, setAddingAnswer] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        text: "", is_correct: false,
    });

    function submitAnswer(e) {
        e.preventDefault();
        // Правильное имя маршрута для вложенного ресурса: admin.questions.answers.store
        post(route("admin.questions.answers.store", question.id), {
            preserveScroll: true,
            onSuccess: () => { reset(); setAddingAnswer(false); },
        });
    }

    function deleteAnswer(answerId) {
        router.delete(route("admin.answers.destroy", answerId), { preserveScroll: true });
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex-1">
                    <span className="text-xs text-gray-400 mr-2">
                        {question.question_type === "multiple" ? "Несколько ответов" : "Один ответ"}
                    </span>
                    <p className="text-gray-900 font-medium">{question.question_text}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Link
                        href={route("admin.questions.edit", question.id)}
                        className="text-xs text-blue-600 hover:underline"
                    >
                        Изменить
                    </Link>
                    <button
                        onClick={() => onDelete(question.id)}
                        className="text-xs text-red-500 hover:underline"
                    >
                        Удалить
                    </button>
                </div>
            </div>

            {/* Ответы */}
            <ul className="space-y-1.5 mb-3">
                {question.answers.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                        <span className={`w-4 h-4 rounded flex items-center justify-center text-xs shrink-0 ${
                            a.is_correct ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                        }`}>
                            {a.is_correct ? "✓" : "○"}
                        </span>
                        <span className={a.is_correct ? "text-green-700 font-medium" : "text-gray-600"}>
                            {a.answer_text}
                        </span>
                        <button
                            onClick={() => deleteAnswer(a.id)}
                            className="ml-auto text-xs text-gray-300 hover:text-red-400"
                        >
                            ✕
                        </button>
                    </li>
                ))}
            </ul>

            {/* Добавить ответ */}
            {addingAnswer ? (
                <form onSubmit={submitAnswer} className="flex flex-col gap-2 border-t border-gray-50 pt-3">
                    <input
                        value={data.text}
                        onChange={(e) => setData("text", e.target.value)}
                        placeholder="Текст ответа"
                        autoFocus
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 text-sm text-gray-600">
                            <input
                                type="checkbox"
                                checked={data.is_correct}
                                onChange={(e) => setData("is_correct", e.target.checked)}
                                className="accent-green-600"
                            />
                            Верный ответ
                        </label>
                        <button type="submit" disabled={processing}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            Добавить
                        </button>
                        <button type="button" onClick={() => setAddingAnswer(false)}
                            className="text-xs text-gray-400 hover:text-gray-600">
                            Отмена
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setAddingAnswer(true)}
                    className="text-xs text-blue-600 hover:underline border-t border-gray-50 pt-2 mt-2 block"
                >
                    + Добавить вариант ответа
                </button>
            )}
        </div>
    );
}

export default function TestShow({ test }) {
    const [addingQ, setAddingQ] = useState(false);
    const { data, setData, post, processing, reset } = useForm({
        text: "", type: "single", order: "",
    });

    function submitQuestion(e) {
        e.preventDefault();
        post(route("admin.tests.questions.store", test.id), {
            preserveScroll: true,
            onSuccess: () => { reset(); setAddingQ(false); },
        });
    }

    function deleteQuestion(qId) {
        if (confirm("Удалить вопрос?")) {
            router.delete(route("admin.questions.destroy", qId), { preserveScroll: true });
        }
    }

    function deleteTest() {
        if (confirm(`Удалить тест «${test.title}» навсегда?\n\nБудут удалены все вопросы, ответы и результаты прохождений. Это действие нельзя отменить.`)) {
            router.delete(route("admin.tests.force-delete", test.id));
        }
    }

    return (
        <AppLayout title={test.title}>
            <Head title={test.title} />

            <p className="text-xs text-gray-400 mb-6">
                <Link href={route("admin.tests.index")} className="hover:underline">← Тесты</Link>
            </p>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">{test.title}</h2>
                    <p className="text-sm text-gray-400">
                        Порог: {test.passing_score}% ·{" "}
                        {test.questions?.length ?? 0} вопросов ·{" "}
                        <span className={test.is_active ? "text-green-600" : "text-gray-400"}>
                            {test.is_active ? "Активен" : "Неактивен"}
                        </span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={route("admin.tests.edit", test.id)}
                        className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50"
                    >
                        Редактировать
                    </Link>
                    <button
                        onClick={deleteTest}
                        className="px-4 py-2 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50"
                    >
                        Удалить
                    </button>
                </div>
            </div>

            {/* Вопросы */}
            <div className="space-y-4">
                {(test.questions ?? []).map((q) => (
                    <QuestionCard key={q.id} question={q} testId={test.id} onDelete={deleteQuestion} />
                ))}
            </div>

            {/* Добавить вопрос */}
            {addingQ ? (
                <form onSubmit={submitQuestion}
                    className="mt-4 bg-white rounded-xl border border-blue-200 p-5 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Новый вопрос</p>
                    <textarea
                        value={data.text}
                        onChange={(e) => setData("text", e.target.value)}
                        placeholder="Текст вопроса"
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex items-center gap-4">
                        <select
                            value={data.type}
                            onChange={(e) => setData("type", e.target.value)}
                            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="single">Один ответ</option>
                            <option value="multiple">Несколько ответов</option>
                        </select>
                        <input
                            type="number"
                            value={data.order}
                            onChange={(e) => setData("order", e.target.value)}
                            placeholder="Порядок"
                            className="w-24 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button type="submit" disabled={processing}
                            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            Добавить
                        </button>
                        <button type="button" onClick={() => setAddingQ(false)}
                            className="text-sm text-gray-400 hover:text-gray-600">
                            Отмена
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setAddingQ(true)}
                    className="mt-4 w-full py-3 border-2 border-dashed border-gray-200 text-gray-400 text-sm rounded-xl hover:border-blue-300 hover:text-blue-500 transition-colors"
                >
                    + Добавить вопрос
                </button>
            )}
        </AppLayout>
    );
}
