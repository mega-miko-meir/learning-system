import { router, useForm } from "@inertiajs/react";
import { useRef, useState } from "react";

function formatDuration(sec) {
    if (!sec) return "длительность не определена";
    const m = Math.floor(sec / 60);
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
}

// Определяем длительность ролика прямо в браузере — она нужна серверу, чтобы посчитать порог просмотра 90%.
function readVideoDuration(file) {
    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => {
            const d = Number.isFinite(v.duration) ? Math.round(v.duration) : null;
            URL.revokeObjectURL(url);
            resolve(d);
        };
        v.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        v.src = url;
    });
}

// Материалы обучения без теста: видеоролики и текстовые пункты (устный инструктаж).
export default function InductionMaterials({ document: doc, materials }) {
    const fileRef = useRef(null);
    const [kind, setKind] = useState("video");
    const [durationFailed, setDurationFailed] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        kind: "video",
        title: "",
        body: "",
        is_required: true,
        duration_seconds: null,
        file: null,
    });

    function switchKind(k) {
        setKind(k);
        setData((prev) => ({ ...prev, kind: k, file: null, duration_seconds: null }));
        if (fileRef.current) fileRef.current.value = "";
    }

    async function pickFile(e) {
        const file = e.target.files[0] ?? null;
        setDurationFailed(false);
        setData((prev) => ({ ...prev, file, duration_seconds: null }));
        if (file) {
            const duration = await readVideoDuration(file);
            setDurationFailed(!duration);
            setData((prev) => ({ ...prev, duration_seconds: duration }));
        }
    }

    function submit(e) {
        e.preventDefault();
        post(route("admin.documents.materials.store", doc.id), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setKind("video");
                if (fileRef.current) fileRef.current.value = "";
            },
        });
    }

    function toggleRequired(m) {
        router.patch(route("admin.materials.update", m.id), {
            title: m.title, body: m.body, is_required: !m.is_required,
        }, { preserveScroll: true });
    }

    function remove(m) {
        if (confirm(`Удалить материал «${m.title}»?`)) {
            router.delete(route("admin.materials.destroy", m.id), { preserveScroll: true });
        }
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Материалы обучения</h2>
            <p className="text-xs text-gray-400 mb-3">
                Обучение без теста: сотрудник смотрит видео (засчитывается от 90%) и подтверждает ознакомление —
                после этого статус ставится автоматически.
            </p>

            {materials.length === 0 ? (
                <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mb-3">Материалы не добавлены</p>
            ) : (
                <ul className="space-y-2 mb-4">
                    {materials.map((m) => (
                        <li key={m.id} className="border border-gray-100 rounded-lg px-3 py-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm text-gray-800 font-medium break-words">{m.title}</p>
                                    <p className="text-xs text-gray-400">
                                        {m.kind === "video"
                                            ? `Видео · ${formatDuration(m.duration_seconds)}`
                                            : "Устный инструктаж"}
                                    </p>
                                    {m.body && <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">{m.body}</p>}
                                </div>
                                <button onClick={() => remove(m)} className="text-xs text-red-500 hover:text-red-700 shrink-0">
                                    Удалить
                                </button>
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                                {m.kind === "video" && (
                                    <>
                                        <label className="flex items-center gap-1.5 text-xs text-gray-600">
                                            <input type="checkbox" checked={m.is_required}
                                                onChange={() => toggleRequired(m)}
                                                className="w-3.5 h-3.5 accent-blue-600" />
                                            Обязательно
                                        </label>
                                        <a href={m.preview_url} target="_blank" rel="noreferrer"
                                            className="text-xs text-blue-600 hover:underline">
                                            Предпросмотр
                                        </a>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={submit} className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex gap-2">
                    {[["video", "Видео"], ["text", "Устный инструктаж"]].map(([k, label]) => (
                        <button key={k} type="button" onClick={() => switchKind(k)}
                            className={`flex-1 px-3 py-1.5 text-xs rounded-lg border ${
                                kind === k ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}>
                            {label}
                        </button>
                    ))}
                </div>

                <div>
                    <input
                        value={data.title}
                        onChange={(e) => setData("title", e.target.value)}
                        placeholder={kind === "video" ? "Например: Порядок входа/выхода в синюю зону" : "Например: Устный инструктаж по основным требованиям GMP"}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>

                {kind === "video" ? (
                    <div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept="video/mp4,video/webm,video/quicktime"
                            onChange={pickFile}
                            className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 file:text-xs"
                        />
                        {data.file && (
                            <p className="mt-1 text-xs text-gray-400">
                                {durationFailed
                                    ? <span className="text-red-600">Не удалось прочитать видео — проверьте формат (лучше MP4, H.264)</span>
                                    : <>Длительность: {data.duration_seconds ? formatDuration(data.duration_seconds) : "определяется..."}</>}
                            </p>
                        )}
                        {errors.file && <p className="mt-1 text-xs text-red-600">{errors.file}</p>}
                        <p className="mt-1 text-xs text-gray-400">MP4, WebM или MOV, до 500 МБ</p>
                    </div>
                ) : (
                    <div>
                        <textarea
                            value={data.body}
                            onChange={(e) => setData("body", e.target.value)}
                            rows={3}
                            placeholder="Описание (необязательно)"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                        {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
                    </div>
                )}

                {kind === "video" && (
                    <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input type="checkbox" checked={data.is_required}
                            onChange={(e) => setData("is_required", e.target.checked)}
                            className="w-3.5 h-3.5 accent-blue-600" />
                        Обязательное к просмотру
                    </label>
                )}

                <button
                    type="submit"
                    disabled={processing || !data.title.trim() || (kind === "video" && (!data.file || !data.duration_seconds))}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {processing ? "Загружаем..." : "Добавить"}
                </button>
            </form>
        </div>
    );
}
