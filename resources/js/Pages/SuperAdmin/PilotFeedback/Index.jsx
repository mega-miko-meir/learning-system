import { useState } from "react";
import AppLayout from "../../../Layouts/AppLayout";
import Pagination from "../../../Components/Pagination";

function Stars({ value }) {
    if (!value) return <span className="text-gray-300">—</span>;
    return (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
            {value} / 5
        </span>
    );
}

function Tag({ value, tone = "gray" }) {
    if (!value) return <span className="text-gray-300">—</span>;
    const tones = {
        gray: "bg-gray-100 text-gray-600",
        green: "bg-green-50 text-green-700",
        red: "bg-red-50 text-red-700",
    };
    return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${tones[tone]}`}>{value}</span>;
}

function Row({ r }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border border-gray-100 rounded-xl bg-white">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-4 px-4 py-3 text-left"
            >
                <span className="text-xs text-gray-400 w-32 shrink-0">{r.created_at}</span>
                <span className="text-xs text-gray-400 w-28 shrink-0 font-mono">{r.ip_address || "—"}</span>
                <span className="w-16 shrink-0"><Stars value={r.nav_rating} /></span>
                <span className="w-20 shrink-0">
                    <Tag value={r.had_issues} tone={r.had_issues === "Да" ? "red" : "green"} />
                </span>
                <span className="flex-1 text-sm text-gray-600 truncate">
                    {r.liked || r.difficulties || r.suggestions || <span className="text-gray-300">Без текстового отзыва</span>}
                </span>
                <svg
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Навигация</p>
                            <Stars value={r.nav_rating} />
                            {r.nav_comment && <p className="text-gray-600 mt-1">{r.nav_comment}</p>}
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Технические проблемы</p>
                            <Tag value={r.had_issues} tone={r.had_issues === "Да" ? "red" : "green"} />
                            {r.issue_description && <p className="text-gray-600 mt-1">{r.issue_description}</p>}
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Таймер и кнопки</p>
                            <Tag value={r.timer_buttons_ok} tone={r.timer_buttons_ok === "Было не так" ? "red" : "green"} />
                            {r.timer_buttons_comment && <p className="text-gray-600 mt-1">{r.timer_buttons_comment}</p>}
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Повторные попытки теста</p>
                            <Tag value={r.retry_clarity} tone={r.retry_clarity === "Было непонятно" ? "red" : "green"} />
                            {r.retry_comment && <p className="text-gray-600 mt-1">{r.retry_comment}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-50">
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Понравилось</p>
                            <p className="text-gray-700">{r.liked || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Трудности</p>
                            <p className="text-gray-700">{r.difficulties || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Пожелания</p>
                            <p className="text-gray-700">{r.suggestions || "—"}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Index({ responses }) {
    return (
        <AppLayout title="Отзывы о пилоте">
            <div className="space-y-3 max-w-5xl">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">
                        Всего отзывов: {responses.total}. Ответы анонимны.
                    </p>
                    <a
                        href={route("superadmin.pilot-feedback.export")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Экспорт в Excel
                    </a>
                </div>

                {responses.data.length === 0 ? (
                    <div className="text-center text-gray-400 py-16 bg-white border border-gray-100 rounded-xl">
                        Пока нет ни одного отзыва
                    </div>
                ) : (
                    responses.data.map((r) => <Row key={r.id} r={r} />)
                )}

                <Pagination links={responses.links} />
            </div>
        </AppLayout>
    );
}
