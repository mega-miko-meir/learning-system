import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";

const SEND_INTERVAL_MS = 5000;
const SEEK_TOLERANCE_S = 1.5;

// Плеер с учётом просмотра. Сервер — источник истины (см. App\Services\InductionProgress):
// клиент шлёт «максимально просмотренную» позицию раз в 5 секунд, а перемотка вперёд за неё блокируется.
function VideoItem({ assignmentId, material, readOnly, onCompleted }) {
    const videoRef     = useRef(null);
    const maxRef       = useRef(material.max_position_seconds);
    const lastSentRef  = useRef(0);
    const completedRef = useRef(material.completed);

    const [percent, setPercent]     = useState(material.percent);
    const [completed, setCompleted] = useState(material.completed);

    function send() {
        const v = videoRef.current;
        if (!v || readOnly || completedRef.current) return;

        window.axios
            .post(route("employee.induction.progress", [assignmentId, material.id]), {
                position: Math.floor(maxRef.current),
                duration: Number.isFinite(v.duration) ? Math.floor(v.duration) : null,
            })
            .then((res) => {
                setPercent(res.data.percent);
                if (res.data.completed && !completedRef.current) {
                    completedRef.current = true;
                    setCompleted(true);
                    onCompleted();
                }
            })
            .catch(() => {});
    }

    // Уход со страницы — сохраняем то, что успели досмотреть.
    useEffect(() => () => send(), []); // eslint-disable-line react-hooks/exhaustive-deps

    function handleLoadedMetadata() {
        const v = videoRef.current;
        if (maxRef.current > 0 && maxRef.current < v.duration - 2) {
            v.currentTime = maxRef.current; // продолжить с места остановки
        }
    }

    function handleTimeUpdate() {
        const v = videoRef.current;
        if (completedRef.current || readOnly) return;

        // Засчитываем только естественное воспроизведение, не прыжок вперёд.
        if (v.currentTime <= maxRef.current + SEEK_TOLERANCE_S) {
            maxRef.current = Math.max(maxRef.current, v.currentTime);
        }

        if (Date.now() - lastSentRef.current >= SEND_INTERVAL_MS) {
            lastSentRef.current = Date.now();
            send();
        }
    }

    function handleSeeking() {
        const v = videoRef.current;
        if (completedRef.current || readOnly) return;
        if (v.currentTime > maxRef.current + SEEK_TOLERANCE_S) {
            v.currentTime = maxRef.current;
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <p className="text-sm font-semibold text-gray-900">{material.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Видео{material.is_required ? " · обязательно к просмотру" : ""}
                    </p>
                </div>
                {completed ? (
                    <span className="shrink-0 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                        Просмотрено ✓
                    </span>
                ) : (
                    <span className="shrink-0 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        Не просмотрено
                    </span>
                )}
            </div>

            <video
                ref={videoRef}
                src={material.stream_url}
                controls
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                preload="metadata"
                onContextMenu={(e) => e.preventDefault()}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onSeeking={handleSeeking}
                onPause={send}
                onEnded={send}
                className="w-full rounded-lg bg-black max-h-[420px]"
            />

            {material.is_required && (
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Просмотрено: {completed ? "100" : percent}%</span>
                        <span>для зачёта нужно не менее 90%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${completed ? "bg-green-500" : "bg-blue-500"}`}
                            style={{ width: `${completed ? 100 : percent}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Induction({ assignment, materials, videos_done, threshold_percent }) {
    const [confirmed, setConfirmed] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isCompleted = assignment.status === "completed";
    const isReadOnly  = !["pending", "in_progress"].includes(assignment.status);

    function refreshState() {
        router.reload({ only: ["assignment", "materials", "videos_done"] });
    }

    function acknowledge() {
        setSubmitting(true);
        router.post(route("employee.induction.acknowledge", assignment.id), {}, {
            preserveScroll: true,
            onFinish: () => setSubmitting(false),
        });
    }

    return (
        <AppLayout title={assignment.document.title}>
            <Head title={assignment.document.title} />

            <p className="text-xs text-gray-400 mb-6">
                <Link href={route("employee.assignments")} className="hover:underline">← Мои задания</Link>
            </p>

            <div className="max-w-3xl space-y-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs text-gray-400 mb-1">Обучение без теста</p>
                            <h2 className="text-base font-semibold text-gray-900">{assignment.document.title}</h2>
                            {assignment.due_date && (
                                <p className="text-xs text-gray-400 mt-1">Срок: {assignment.due_date}</p>
                            )}
                        </div>
                        <a
                            href={assignment.document.view_url}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Открыть документ
                        </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        Ознакомьтесь с документом, пройдите устный инструктаж и просмотрите видеоролики до конца
                        (засчитывается не менее {threshold_percent}% длительности). Тест сдавать не нужно —
                        после просмотра и подтверждения ознакомления инструктаж отмечается пройденным автоматически.
                    </p>
                </div>

                {materials.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-100 p-5 text-sm text-gray-400">
                        Материалы ещё не добавлены. Обратитесь к администратору.
                    </div>
                )}

                {materials.map((m) =>
                    m.kind === "video" ? (
                        <VideoItem
                            key={m.id}
                            assignmentId={assignment.id}
                            material={m}
                            readOnly={isReadOnly}
                            onCompleted={refreshState}
                        />
                    ) : (
                        <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-5">
                            <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Устный инструктаж</p>
                            {m.body && <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">{m.body}</p>}
                        </div>
                    )
                )}

                {isCompleted ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                        <p className="text-sm font-semibold text-green-800">Инструктаж пройден ✓</p>
                        {assignment.completed_at && (
                            <p className="text-xs text-green-700 mt-1">Отмечено автоматически: {assignment.completed_at}</p>
                        )}
                    </div>
                ) : !isReadOnly ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-5">
                        <label className={`flex items-start gap-3 text-sm ${videos_done ? "text-gray-700 cursor-pointer" : "text-gray-400"}`}>
                            <input
                                type="checkbox"
                                checked={confirmed}
                                disabled={!videos_done}
                                onChange={(e) => setConfirmed(e.target.checked)}
                                className="mt-0.5 w-4 h-4 accent-blue-600"
                            />
                            Я ознакомлен(а) с документом, прошёл(шла) устный инструктаж и просмотрел(а) видеоматериалы
                        </label>
                        {!videos_done && (
                            <p className="text-xs text-gray-400 mt-2">
                                Подтверждение станет доступно после просмотра всех обязательных видео.
                            </p>
                        )}
                        <button
                            onClick={acknowledge}
                            disabled={!videos_done || !confirmed || submitting}
                            className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? "Сохраняем..." : "Подтвердить ознакомление"}
                        </button>
                    </div>
                ) : null}
            </div>
        </AppLayout>
    );
}
