import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

export default function TestShow({ assignment, test, attempt_id, time_remaining }) {
    const [answers, setAnswers]             = useState({});
    const [attemptId, setAttemptId]         = useState(attempt_id);
    const [attemptNumber, setAttemptNumber] = useState(assignment.attempt_count + 1);
    const [result, setResult]               = useState(null);
    const [submitting, setSubmitting]       = useState(false);
    // time_remaining от сервера — авторитетный источник (учитывает started_at)
    const [timeLeft, setTimeLeft] = useState(
        test.time_limit ? (time_remaining ?? test.time_limit * 60) : null
    );
    const timerRef = useRef(null);

    // Keepalive — не даём сессии протухнуть во время теста (баг 419)
    useEffect(() => {
        const ping = setInterval(() => {
            window.axios.get(route("ping")).catch(() => {});
        }, 4 * 60_000); // каждые 4 минуты достаточно
        return () => clearInterval(ping);
    }, []);

    // Запускаем таймер когда есть attemptId (т.е. сразу при загрузке)
    useEffect(() => {
        if (timeLeft === null || !attemptId) return;

        // Время уже истекло пока страница грузилась — сразу сдаём
        if (timeLeft === 0) {
            handleSubmit(true);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmit(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1_000);

        return () => clearInterval(timerRef.current);
    }, [attemptId]); // перезапускается при новой попытке ("Попробовать снова")

    function pick(questionId, answerId, type) {
        setAnswers((prev) =>
            type === "multiple"
                ? {
                      ...prev,
                      [questionId]: prev[questionId]?.includes(answerId)
                          ? prev[questionId].filter((a) => a !== answerId)
                          : [...(prev[questionId] ?? []), answerId],
                  }
                : { ...prev, [questionId]: answerId }
        );
    }

    async function handleSubmit(silent = false) {
        if (submitting || !attemptId) return;

        // Предупреждение если не все вопросы отвечены (не показываем при таймауте)
        if (!silent) {
            const unanswered = test.questions.filter((q) => {
                const a = answers[q.id];
                return a === undefined || a === null || (Array.isArray(a) && a.length === 0);
            });
            if (unanswered.length > 0) {
                const ok = window.confirm(
                    `Вы не ответили на ${unanswered.length} из ${test.questions.length} вопросов.\nСдать тест с пропущенными ответами?`
                );
                if (!ok) return;
            }
        }

        setSubmitting(true);
        clearInterval(timerRef.current);

        try {
            const { data } = await window.axios.post(
                route("employee.test.submit", assignment.id),
                { attempt_id: attemptId, answers }
            );
            setResult(data);
        } catch (err) {
            const status = err?.response?.status;
            if (status === 419) {
                // CSRF-токен устарел — обновляем сессию и пробуем один раз автоматически
                try {
                    await window.axios.get(route("ping"));
                    const { data } = await window.axios.post(
                        route("employee.test.submit", assignment.id),
                        { attempt_id: attemptId, answers }
                    );
                    setResult(data);
                } catch {
                    alert("Сессия устарела. Обновите страницу и сдайте тест снова.");
                }
            } else if (status === 422) {
                alert("Ошибка валидации. Попробуйте ещё раз.");
            } else {
                alert(`Ошибка при отправке теста (${status ?? "сеть"}). Попробуйте ещё раз.`);
            }
        } finally {
            setSubmitting(false);
        }
    }

    // Только для кнопки "Попробовать снова" — получаем новую попытку с сервера
    async function startNewAttempt() {
        try {
            const { data } = await window.axios.post(route("employee.test.start", assignment.id));
            setAttemptId(data.attempt_id);
            setAttemptNumber(data.attempt_number);
        } catch {
            alert("Не удалось начать новую попытку. Обновите страницу.");
        }
    }

    function formatTime(secs) {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    }

    // ── Экран результата ──────────────────────────────────────────────
    if (result) {
        return (
            <AppLayout title="Результат теста">
                <Head title="Результат теста" />
                <div className="max-w-lg mx-auto mt-12">
                    <div className={`bg-white rounded-2xl border p-8 text-center ${
                        result.passed ? "border-green-200" : "border-red-200"
                    }`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${
                            result.passed ? "bg-green-100" : "bg-red-100"
                        }`}>
                            {result.passed ? "✓" : "✕"}
                        </div>
                        <h2 className={`text-xl font-bold mb-2 ${
                            result.passed ? "text-green-700" : "text-red-700"
                        }`}>
                            {result.passed ? "Тест пройден!" : "Тест не пройден"}
                        </h2>
                        <p className="text-4xl font-bold text-gray-900 mb-1">{result.score}%</p>
                        <p className="text-sm text-gray-400 mb-6">
                            Порог сдачи — {test.pass_percentage}%
                        </p>

                        {result.blocked && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
                                Все попытки исчерпаны. Тест не пройден. Обратитесь к администратору.
                            </div>
                        )}

                        {!result.passed && !result.blocked && (
                            <p className="text-sm text-gray-500 mb-6">
                                Осталось попыток: <strong>{result.attempts_left}</strong>
                            </p>
                        )}

                        <div className="flex gap-3 justify-center">
                            <Link
                                href={route("employee.assignments")}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                К заданиям
                            </Link>
                            {!result.passed && !result.blocked && (
                                <button
                                    onClick={async () => {
                                        setResult(null);
                                        setAnswers({});
                                        setAttemptId(null);
                                        setTimeLeft(test.time_limit ? test.time_limit * 60 : null);
                                        await startNewAttempt();
                                    }}
                                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-700"
                                >
                                    Попробовать снова
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    // ── Экран теста ───────────────────────────────────────────────────
    return (
        <AppLayout title={test.title}>
            <Head title={test.title} />

            {/* Шапка */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <p className="text-xs text-gray-400 mb-1">
                        Попытка {attemptNumber} из {assignment.max_attempts}
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900">{test.title}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Для сдачи нужно {test.pass_percentage}% верных ответов
                    </p>
                </div>
                {timeLeft !== null && (
                    <div className={`font-mono text-xl font-bold px-4 py-2 rounded-xl ${
                        timeLeft < 60 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"
                    }`}>
                        {formatTime(timeLeft)}
                    </div>
                )}
            </div>

            {/* Вопросы */}
            <div className="space-y-6">
                {test.questions.map((q, idx) => (
                    <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-5">
                        <p className="font-medium text-gray-900 mb-4">
                            <span className="text-gray-400 mr-2">{idx + 1}.</span>
                            {q.text}
                        </p>
                        <div className="space-y-2">
                            {q.answers.map((a) => {
                                const selected =
                                    q.type === "multiple"
                                        ? (answers[q.id] ?? []).includes(a.id)
                                        : answers[q.id] === a.id;
                                return (
                                    <label
                                        key={a.id}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                                            selected
                                                ? "border-blue-400 bg-blue-50"
                                                : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                        }`}
                                    >
                                        <input
                                            type={q.type === "multiple" ? "checkbox" : "radio"}
                                            name={`q_${q.id}`}
                                            checked={selected}
                                            onChange={() => pick(q.id, a.id, q.type)}
                                            className="accent-blue-600"
                                        />
                                        <span className="text-sm text-gray-800">{a.text}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Кнопка сдачи */}
            <div className="flex justify-end mt-8">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !attemptId}
                    className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl
                        hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                >
                    {submitting ? "Проверяем..." : "Сдать тест"}
                </button>
            </div>
        </AppLayout>
    );
}
