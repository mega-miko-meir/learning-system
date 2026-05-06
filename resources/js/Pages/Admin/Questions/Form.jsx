import { Head, Link, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ─── Один сортируемый ответ ──────────────────────────────────
function SortableAnswer({ answer, onDelete, onSave }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: answer.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const [editing, setEditing]         = useState(false);
    const [text, setText]               = useState(answer.answer_text);
    const [isCorrect, setIsCorrect]     = useState(answer.is_correct);
    const [saving, setSaving]           = useState(false);

    async function save() {
        setSaving(true);
        await window.axios.put(route("admin.answers.update", answer.id), {
            text, is_correct: isCorrect,
        });
        onSave();
        setSaving(false);
        setEditing(false);
    }

    return (
        <li ref={setNodeRef} style={style}
            className={`flex items-start gap-2 p-3 rounded-lg border ${
                isDragging ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-transparent"
            }`}
        >
            {/* Drag handle */}
            <button
                type="button"
                {...attributes}
                {...listeners}
                className="mt-0.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0 touch-none"
                title="Перетащить"
            >
                ⠿
            </button>

            {/* Контент */}
            <div className="flex-1 min-w-0">
                {editing ? (
                    <div className="space-y-2">
                        <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            autoFocus
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isCorrect}
                                onChange={(e) => setIsCorrect(e.target.checked)}
                                className="w-4 h-4 accent-green-600"
                            />
                            Правильный ответ
                        </label>
                        <div className="flex gap-2">
                            <button onClick={save} disabled={saving}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                {saving ? "Сохраняем..." : "Сохранить"}
                            </button>
                            <button type="button" onClick={() => { setEditing(false); setText(answer.answer_text); setIsCorrect(answer.is_correct); }}
                                className="text-xs text-gray-400 hover:text-gray-600">
                                Отмена
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-xs shrink-0 font-bold ${
                            isCorrect ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                        }`}>
                            {isCorrect ? "✓" : "○"}
                        </span>
                        <span className={`flex-1 text-sm ${isCorrect ? "text-green-700 font-medium" : "text-gray-700"}`}>
                            {text}
                        </span>
                    </div>
                )}
            </div>

            {/* Кнопки действий */}
            {!editing && (
                <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setEditing(true)}
                        className="text-xs text-blue-500 hover:text-blue-700">
                        Изменить
                    </button>
                    <button type="button" onClick={() => onDelete(answer.id)}
                        className="text-xs text-red-400 hover:text-red-600">
                        Удалить
                    </button>
                </div>
            )}
        </li>
    );
}

// ─── Основная страница ────────────────────────────────────────
export default function QuestionForm({ test, question }) {
    const isEdit = !!question;
    const testId = test?.id ?? question?.test_id;

    const form = useForm({
        text:  question?.question_text ?? "",
        type:  question?.question_type ?? "single",
        order: question?.order_number  ?? "",
    });

    const answerForm = useForm({ text: "", is_correct: false });
    const [showAddAnswer, setShowAddAnswer] = useState(false);

    // Локальный список ответов для DnD (переупорядочивание без reload)
    const [answers, setAnswers] = useState(question?.answers ?? []);

    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: { distance: 5 },
    }));

    function submitQuestion(e) {
        e.preventDefault();
        if (isEdit) {
            form.put(route("admin.questions.update", question.id), { preserveScroll: true });
        } else {
            form.post(route("admin.tests.questions.store", testId), {
                preserveScroll: true,
                onSuccess: () => form.reset(),
            });
        }
    }

    function addAnswer(e) {
        e.preventDefault();
        answerForm.post(route("admin.questions.answers.store", question.id), {
            preserveScroll: true,
            onSuccess: () => {
                answerForm.reset();
                setShowAddAnswer(false);
                // Перезагружаем данные чтобы получить новый ответ с ID
                router.reload({ only: [], preserveScroll: true });
            },
        });
    }

    function deleteAnswer(answerId) {
        if (!confirm("Удалить вариант ответа?")) return;
        router.delete(route("admin.answers.destroy", answerId), {
            preserveScroll: true,
            onSuccess: () => setAnswers((prev) => prev.filter((a) => a.id !== answerId)),
        });
    }

    function handleDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = answers.findIndex((a) => a.id === active.id);
        const newIndex = answers.findIndex((a) => a.id === over.id);
        const reordered = arrayMove(answers, oldIndex, newIndex);
        setAnswers(reordered);

        // Сохраняем порядок на сервере
        window.axios.post(route("admin.questions.reorder-answers", question.id), {
            ids: reordered.map((a) => a.id),
        });
    }

    // Обновляем локальный список после изменения ответа
    function handleAnswerSave() {
        router.reload({ preserveScroll: true });
    }

    return (
        <AppLayout title={isEdit ? "Редактировать вопрос" : "Добавить вопрос"}>
            <Head title={isEdit ? "Редактировать вопрос" : "Добавить вопрос"} />

            <p className="text-xs text-gray-400 mb-6">
                <Link href={route("admin.tests.show", testId)} className="hover:underline">
                    ← Назад к тесту
                </Link>
            </p>

            <div className="max-w-2xl space-y-6">
                {/* Форма вопроса */}
                <form onSubmit={submitQuestion} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-700">
                        {isEdit ? "Редактировать вопрос" : "Новый вопрос"}
                    </h2>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                            Текст вопроса <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.data.text}
                            onChange={(e) => form.setData("text", e.target.value)}
                            rows={3}
                            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                                form.errors.text ? "border-red-300" : "border-gray-200"
                            }`}
                        />
                        {form.errors.text && (
                            <p className="mt-1 text-xs text-red-600">{form.errors.text}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Тип ответа</label>
                            <select
                                value={form.data.type}
                                onChange={(e) => form.setData("type", e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="single">Один правильный ответ</option>
                                <option value="multiple">Несколько правильных ответов</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Порядок</label>
                            <input
                                type="number"
                                value={form.data.order}
                                onChange={(e) => form.setData("order", e.target.value)}
                                placeholder="0"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="submit" disabled={form.processing}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                            {form.processing ? "Сохраняем..." : isEdit ? "Сохранить изменения" : "Добавить вопрос"}
                        </button>
                        <Link href={route("admin.tests.show", testId)}
                            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
                            Отмена
                        </Link>
                    </div>
                </form>

                {/* Варианты ответов (только при редактировании) */}
                {isEdit && (
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-gray-700">
                                Варианты ответов
                                <span className="ml-2 text-xs font-normal text-gray-400">
                                    ({answers.length})
                                </span>
                            </h2>
                            <p className="text-xs text-gray-400">Перетащите для изменения порядка</p>
                        </div>

                        {/* DnD список */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={answers.map((a) => a.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <ul className="space-y-2 mb-4">
                                    {answers.map((a) => (
                                        <SortableAnswer
                                            key={a.id}
                                            answer={a}
                                            onDelete={deleteAnswer}
                                            onSave={handleAnswerSave}
                                        />
                                    ))}
                                </ul>
                            </SortableContext>
                        </DndContext>

                        {answers.length === 0 && (
                            <p className="text-sm text-gray-400 mb-4">Ответов ещё нет</p>
                        )}

                        {/* Добавить ответ */}
                        {showAddAnswer ? (
                            <form onSubmit={addAnswer} className="border border-blue-200 rounded-lg p-4 space-y-3 bg-blue-50">
                                <p className="text-xs font-medium text-blue-700">Новый вариант ответа</p>
                                <input
                                    value={answerForm.data.text}
                                    onChange={(e) => answerForm.setData("text", e.target.value)}
                                    placeholder="Текст ответа"
                                    autoFocus
                                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                                        answerForm.errors.text ? "border-red-300" : "border-gray-200"
                                    }`}
                                />
                                {answerForm.errors.text && (
                                    <p className="text-xs text-red-600">{answerForm.errors.text}</p>
                                )}
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={answerForm.data.is_correct}
                                            onChange={(e) => answerForm.setData("is_correct", e.target.checked)}
                                            className="w-4 h-4 accent-green-600"
                                        />
                                        Правильный ответ
                                    </label>
                                    <button type="submit" disabled={answerForm.processing}
                                        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                                        {answerForm.processing ? "Добавляем..." : "Добавить"}
                                    </button>
                                    <button type="button" onClick={() => { setShowAddAnswer(false); answerForm.reset(); }}
                                        className="text-sm text-gray-400 hover:text-gray-600">
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button onClick={() => setShowAddAnswer(true)}
                                className="w-full py-2.5 border-2 border-dashed border-gray-200 text-gray-400 text-sm rounded-lg hover:border-blue-300 hover:text-blue-500 transition-colors">
                                + Добавить вариант ответа
                            </button>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
