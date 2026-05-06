import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).href;

/**
 * Рендерит PDF через PDF.js в canvas → data URL → <img>.
 * React управляет только img-тегами — нет конфликтов с DOM.
 * Кнопка скачивания отсутствует, открытие в новой вкладке невозможно.
 */
export default function PdfViewer({ url }) {
    const [pages, setPages]   = useState([]); // массив data URL
    const [total, setTotal]   = useState(0);
    const [status, setStatus] = useState("loading"); // loading | done | error
    const cancelRef           = useRef(false);
    // Offscreen canvas для рендеринга (не входит в React-дерево)
    const offscreenRef        = useRef(document.createElement("canvas"));

    useEffect(() => {
        cancelRef.current = false;
        setPages([]);
        setTotal(0);
        setStatus("loading");

        async function load() {
            try {
                const { data } = await window.axios.get(url, {
                    responseType: "arraybuffer",
                });
                if (cancelRef.current) return;

                const pdf = await pdfjsLib.getDocument({ data }).promise;
                if (cancelRef.current) return;

                setTotal(pdf.numPages);
                const canvas = offscreenRef.current;
                const collected = [];

                for (let n = 1; n <= pdf.numPages; n++) {
                    if (cancelRef.current) return;

                    const page     = await pdf.getPage(n);
                    const vp1      = page.getViewport({ scale: 1 });
                    // Масштаб под ширину экрана (ограничиваем максимумом 2x)
                    const scale    = Math.min((window.innerWidth * 0.6) / vp1.width, 2);
                    const viewport = page.getViewport({ scale });

                    canvas.width  = viewport.width;
                    canvas.height = viewport.height;
                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    await page.render({ canvasContext: ctx, viewport }).promise;
                    if (cancelRef.current) return;

                    collected.push(canvas.toDataURL("image/png"));
                    // Обновляем по одной странице чтобы пользователь видел прогресс
                    setPages([...collected]);
                }

                if (!cancelRef.current) setStatus("done");
            } catch (err) {
                if (!cancelRef.current) {
                    console.error("PdfViewer error:", err);
                    setStatus("error");
                }
            }
        }

        load();

        return () => {
            cancelRef.current = true;
        };
    }, [url]);

    return (
        <div className="flex flex-col w-full h-full bg-gray-700">
            {/* Шапка */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-gray-300 text-xs shrink-0 select-none">
                <span className="font-medium tracking-wide">Просмотр документа</span>
                <span>
                    {status === "loading" && `Загрузка... ${pages.length}/${total || "?"} стр.`}
                    {status === "done"    && `${total} стр.`}
                    {status === "error"   && "Ошибка загрузки"}
                </span>
            </div>

            {/* Страницы */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-3 select-none"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
            >
                {status === "loading" && pages.length === 0 && (
                    <div className="flex items-center justify-center h-40">
                        <div className="text-center text-gray-300 text-sm">
                            <div className="w-8 h-8 border-2 border-gray-400 border-t-white rounded-full animate-spin mx-auto mb-3" />
                            Загрузка документа...
                        </div>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex items-center justify-center h-40">
                        <p className="text-red-300 text-sm">Не удалось загрузить документ. Обратитесь к администратору.</p>
                    </div>
                )}

                {pages.map((src, i) => (
                    <div key={i} className="shadow-lg">
                        <img
                            src={src}
                            alt={`Страница ${i + 1}`}
                            className="w-full block"
                            draggable="false"
                            onContextMenu={(e) => e.preventDefault()}
                        />
                    </div>
                ))}

                {/* Спиннер пока загружаются остальные страницы */}
                {status === "loading" && pages.length > 0 && (
                    <div className="text-center py-4">
                        <div className="w-6 h-6 border-2 border-gray-400 border-t-white rounded-full animate-spin mx-auto" />
                    </div>
                )}
            </div>
        </div>
    );
}
