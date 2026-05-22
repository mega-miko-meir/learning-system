import { Head, Link } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import PdfViewer from "../../../Components/PdfViewer";

const HEARTBEAT_INTERVAL_MS = 10_000;

function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function sessionKey(id) {
    return `reading_spent_${id}`;
}

export default function AssignmentShow({ assignment }) {
    const {
        id,
        document: doc,
        status,
        time_spent_seconds,
        required_seconds,
        is_unlocked: serverUnlocked,
        has_test,
        view_url,
    } = assignment;

    if (status === "pending" && (time_spent_seconds ?? 0) === 0) {
        sessionStorage.removeItem(sessionKey(id));
    }

    const storedSeconds  = parseInt(sessionStorage.getItem(sessionKey(id)) ?? "0", 10);
    const initialSeconds = Math.max(time_spent_seconds ?? 0, storedSeconds);

    const [spent, setSpent] = useState(initialSeconds);
    const spentRef          = useRef(initialSeconds);
    const isReadonly        = ["completed", "failed", "expired"].includes(status);

    const remaining = Math.max(0, required_seconds - spent);
    const unlocked  = serverUnlocked || remaining === 0;
    const progress  = required_seconds > 0 ? Math.round(spent / required_seconds * 100) : 100;

    // Если администратор сбросил назначение и Inertia обновила пропсы без ремонта —
    // сбрасываем локальный стейт, иначе unlocked остаётся true и PDF не показывается
    useEffect(() => {
        if (status === "pending" && (time_spent_seconds ?? 0) === 0) {
            sessionStorage.removeItem(sessionKey(id));
            setSpent(0);
            spentRef.current = 0;
        }
    }, [id, status, time_spent_seconds]);

    useEffect(() => {
        if (status === "pending") {
            window.axios.post(route("employee.assignments.start", id));
        }
    }, []);

    useEffect(() => {
        if (isReadonly) return;

        const tick = setInterval(() => {
            setSpent((prev) => {
                const next = Math.min(prev + 1, required_seconds);
                spentRef.current = next;
                sessionStorage.setItem(sessionKey(id), String(next));
                return next;
            });
        }, 1_000);

        const heartbeat = setInterval(() => {
            sendHeartbeat(spentRef.current);
        }, HEARTBEAT_INTERVAL_MS);

        function handleUnload() {
            const url  = route("employee.assignments.heartbeat", id);
            const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content ?? "";
            const blob = new Blob(
                [JSON.stringify({ seconds: spentRef.current, _token: csrf })],
                { type: "application/json" }
            );
            navigator.sendBeacon ? navigator.sendBeacon(url, blob) : sendHeartbeat(spentRef.current);
        }

        window.addEventListener("beforeunload", handleUnload);
        return () => {
            clearInterval(tick);
            clearInterval(heartbeat);
            window.removeEventListener("beforeunload", handleUnload);
            sendHeartbeat(spentRef.current);
        };
    }, []);

    function sendHeartbeat(seconds) {
        window.axios.post(route("employee.assignments.heartbeat", id), { seconds });
    }

    return (
        <AppLayout fullHeight>
            <Head title={doc.title} />

            {/* Компактная шапка — одна строка */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white shrink-0">
                <Link href={route("employee.assignments")} className="text-xs text-gray-400 hover:underline shrink-0">
                    ← Назад
                </Link>

                <div className="w-px h-4 bg-gray-200 shrink-0" />

                <span className="text-sm font-semibold text-gray-900 truncate">{doc.title}</span>
                <span className="text-xs text-gray-400 shrink-0">v{doc.version}</span>

                {/* Правая часть: таймер + кнопка */}
                <div className="ml-auto flex items-center gap-3 shrink-0">
                    {!isReadonly && !unlocked && (
                        <>
                            <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="font-mono text-sm font-bold text-blue-600 tabular-nums w-12 text-right">
                                {formatTime(remaining)}
                            </span>
                            {has_test && (
                                <button disabled className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
                                    К тесту
                                </button>
                            )}
                        </>
                    )}

                    {!isReadonly && unlocked && (
                        <>
                            <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                Изучен ✓
                            </span>
                            {has_test && (
                                <Link
                                    href={route("employee.test.show", id)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    Перейти к тесту →
                                </Link>
                            )}
                        </>
                    )}

                    {status === "completed" && (
                        <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                            Обучение завершено
                        </span>
                    )}
                    {status === "failed" && (
                        <span className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                            Тест не пройден — обратитесь к администратору
                        </span>
                    )}
                    {status === "expired" && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                            Срок истёк
                        </span>
                    )}
                </div>
            </div>

            {/* PDF или заглушка — занимает всё оставшееся место */}
            {view_url && !unlocked ? (
                <div className="flex-1 min-h-0 overflow-hidden">
                    <PdfViewer url={view_url} />
                </div>
            ) : (
                <div className="flex-1 min-h-0 bg-gray-50 flex flex-col items-center justify-center text-center">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-500">Просмотр документа закрыт</p>
                    <p className="text-xs text-gray-400 mt-1">
                        {unlocked && !isReadonly  && "Время изучения истекло. Переходите к тесту."}
                        {status === "completed"   && "Обучение завершено — доступ к документу закрыт."}
                        {status === "failed"      && "Попытки исчерпаны — обратитесь к администратору."}
                        {status === "expired"     && "Срок обучения истёк."}
                    </p>
                </div>
            )}
        </AppLayout>
    );
}
