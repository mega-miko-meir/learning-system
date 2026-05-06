import { Head, Link } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import PdfViewer from "../../../Components/PdfViewer";

const HEARTBEAT_INTERVAL_MS = 10_000; // каждые 10 секунд

function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

// sessionStorage key — уникален для каждого назначения и вкладки
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
        has_test,
        view_url,
    } = assignment;

    // Берём максимум из БД и sessionStorage — сохраняется при обновлении страницы
    const storedSeconds  = parseInt(sessionStorage.getItem(sessionKey(id)) ?? "0", 10);
    const initialSeconds = Math.max(time_spent_seconds ?? 0, storedSeconds);

    const [spent, setSpent]   = useState(initialSeconds);
    const spentRef             = useRef(initialSeconds);
    const isReadonly           = ["completed", "failed", "expired"].includes(status);

    const remaining = Math.max(0, required_seconds - spent);
    const unlocked  = remaining === 0;

    // Начинаем обучение при первом открытии
    useEffect(() => {
        if (status === "pending") {
            window.axios.post(route("employee.assignments.start", id));
        }
    }, []);

    // Тик + heartbeat
    useEffect(() => {
        if (isReadonly) return;

        // Локальный тик каждую секунду
        const tick = setInterval(() => {
            setSpent((prev) => {
                const next = Math.min(prev + 1, required_seconds);
                spentRef.current = next;
                // Сохраняем в sessionStorage — переживает обновление страницы
                sessionStorage.setItem(sessionKey(id), String(next));
                return next;
            });
        }, 1_000);

        // Heartbeat — синхронизируем с БД
        const heartbeat = setInterval(() => {
            sendHeartbeat(spentRef.current);
        }, HEARTBEAT_INTERVAL_MS);

        // При уходе: sendBeacon (работает даже при закрытии вкладки)
        function handleUnload() {
            const url  = route("employee.assignments.heartbeat", id);
            const csrf = document.head.querySelector('meta[name="csrf-token"]')?.content ?? "";
            const blob = new Blob(
                [JSON.stringify({ seconds: spentRef.current, _token: csrf })],
                { type: "application/json" }
            );
            if (navigator.sendBeacon) {
                navigator.sendBeacon(url, blob);
            } else {
                sendHeartbeat(spentRef.current);
            }
        }

        window.addEventListener("beforeunload", handleUnload);

        return () => {
            clearInterval(tick);
            clearInterval(heartbeat);
            window.removeEventListener("beforeunload", handleUnload);
            // Сохраняем при Inertia-навигации (размонтирование без unload)
            sendHeartbeat(spentRef.current);
        };
    }, []);

    function sendHeartbeat(seconds) {
        window.axios.post(route("employee.assignments.heartbeat", id), { seconds });
    }

    return (
        <AppLayout title={doc.title}>
            <Head title={doc.title} />

            <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                    <p className="text-xs text-gray-400 mb-1">
                        <Link href={route("employee.assignments")} className="hover:underline">
                            ← Мои задания
                        </Link>
                    </p>
                    <h2 className="text-lg font-semibold text-gray-900">{doc.title}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Версия {doc.version}</p>
                </div>

                {/* Таймер */}
                {!isReadonly && (
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {!unlocked ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-mono text-2xl font-bold text-blue-600 tabular-nums">
                                        {formatTime(remaining)}
                                    </span>
                                </div>
                                <div className="w-52 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.round(spent / required_seconds * 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 text-right">
                                    {has_test
                                        ? "Кнопка «Перейти к тесту» откроется по окончании"
                                        : "Изучите документ перед завершением"}
                                </p>
                                {has_test && (
                                    <button disabled
                                        className="mt-1 px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-400 cursor-not-allowed">
                                        Перейти к тесту
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                    Документ изучен ✓
                                </span>
                                {has_test && (
                                    <Link
                                        href={route("employee.test.show", id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                                    >
                                        Перейти к тесту →
                                    </Link>
                                )}
                            </>
                        )}
                    </div>
                )}

                {status === "completed" && (
                    <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
                        Обучение завершено
                    </span>
                )}
                {status === "failed" && (
                    <span className="px-3 py-1.5 bg-red-50 text-red-700 text-sm rounded-full border border-red-200">
                        Заблокировано — обратитесь к администратору
                    </span>
                )}
            </div>

            {/* PDF виден только пока таймер не истёк; после истечения — замок */}
            {view_url && !unlocked ? (
                <div
                    className="rounded-xl border border-gray-100 overflow-hidden select-none"
                    style={{ height: "calc(100vh - 200px)" }}
                >
                    <PdfViewer url={view_url} />
                </div>
            ) : (
                <div className="rounded-xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center text-center"
                    style={{ height: "calc(100vh - 200px)" }}>
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
