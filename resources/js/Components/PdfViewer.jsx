import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).href;

const RENDER_SCALE = 2;
const DEFAULT_ZOOM = 85;

export default function PdfViewer({ url }) {
    const [pages,       setPages]       = useState([]);
    const [total,       setTotal]       = useState(0);
    const [status,      setStatus]      = useState("loading");
    const [zoom,        setZoom]        = useState(DEFAULT_ZOOM);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput,   setPageInput]   = useState("1");

    const cancelRef    = useRef(false);
    const offscreenRef = useRef(document.createElement("canvas"));
    const containerRef = useRef(null);
    const pageRefs     = useRef([]);

    // Загрузка и рендер всех страниц
    useEffect(() => {
        cancelRef.current = false;
        setPages([]);
        setTotal(0);
        setStatus("loading");
        setCurrentPage(1);
        setPageInput("1");
        pageRefs.current = [];

        async function load() {
            try {
                const { data } = await window.axios.get(url, { responseType: "arraybuffer" });
                if (cancelRef.current) return;

                const pdf = await pdfjsLib.getDocument({ data }).promise;
                if (cancelRef.current) return;

                setTotal(pdf.numPages);
                const canvas = offscreenRef.current;
                const collected = [];

                for (let n = 1; n <= pdf.numPages; n++) {
                    if (cancelRef.current) return;

                    const page     = await pdf.getPage(n);
                    const viewport = page.getViewport({ scale: RENDER_SCALE });

                    canvas.width  = viewport.width;
                    canvas.height = viewport.height;

                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    await page.render({ canvasContext: ctx, viewport }).promise;

                    if (cancelRef.current) return;

                    collected.push(canvas.toDataURL("image/png"));
                    setPages([...collected]);
                }

                if (!cancelRef.current) setStatus("done");
            } catch (err) {
                if (!cancelRef.current) {
                    console.error("PdfViewer:", err);
                    setStatus("error");
                }
            }
        }

        load();
        return () => { cancelRef.current = true; };
    }, [url]);

    // IntersectionObserver — отслеживаем текущую видимую страницу
    useEffect(() => {
        if (pages.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                let maxRatio = 0;
                let visible  = currentPage;
                entries.forEach((e) => {
                    if (e.intersectionRatio > maxRatio) {
                        maxRatio = e.intersectionRatio;
                        visible  = parseInt(e.target.dataset.page, 10);
                    }
                });
                if (maxRatio > 0) {
                    setCurrentPage(visible);
                    setPageInput(String(visible));
                }
            },
            { root: containerRef.current, threshold: [0, 0.25, 0.5, 0.75, 1] }
        );

        pageRefs.current.forEach((el) => { if (el) observer.observe(el); });
        return () => observer.disconnect();
    }, [pages.length]);

    function scrollToPage(n) {
        const p = Math.max(1, Math.min(n, total));
        const el = pageRefs.current[p - 1];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        setCurrentPage(p);
        setPageInput(String(p));
    }

    function handlePageSubmit(e) {
        e.preventDefault();
        const n = parseInt(pageInput, 10);
        if (!isNaN(n)) scrollToPage(n);
    }

    function zoomBy(delta) {
        setZoom(prev => Math.max(40, Math.min(prev + delta, 200)));
    }

    function fitWidth() {
        setZoom(DEFAULT_ZOOM);
    }

    return (
        <div className="flex flex-col w-full h-full bg-gray-700">

            {/* Панель управления */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-gray-200 text-xs shrink-0 select-none">

                {/* Навигация по страницам */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => scrollToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 disabled:opacity-30 text-base leading-none"
                    >‹</button>

                    <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
                        <input
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            onBlur={handlePageSubmit}
                            className="w-10 text-center bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-white text-xs"
                        />
                    </form>

                    <span className="text-gray-400">/ {total || "—"}</span>

                    <button
                        onClick={() => scrollToPage(currentPage + 1)}
                        disabled={currentPage >= total}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 disabled:opacity-30 text-base leading-none"
                    >›</button>
                </div>

                <div className="w-px h-4 bg-gray-700 mx-1" />

                {/* Масштаб */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => zoomBy(-10)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-base font-bold"
                    >−</button>

                    <span className="w-12 text-center tabular-nums text-white">{zoom}%</span>

                    <button
                        onClick={() => zoomBy(10)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-base font-bold"
                    >+</button>

                    <button
                        onClick={fitWidth}
                        className="px-2 py-1 rounded hover:bg-gray-700 text-xs text-gray-300 border border-gray-600 ml-1"
                    >
                        По ширине
                    </button>
                </div>

                {status === "loading" && (
                    <span className="ml-auto text-gray-500">
                        {pages.length > 0 ? `${pages.length} / ${total}…` : "Загрузка…"}
                    </span>
                )}
            </div>

            {/* Страницы */}
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto overflow-x-auto p-4 bg-gray-600 select-none"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
            >
                {status === "loading" && pages.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-20 text-gray-300 text-sm gap-3">
                        <div className="w-8 h-8 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                        Загрузка документа…
                    </div>
                )}

                {status === "error" && (
                    <p className="mt-20 text-center text-red-300 text-sm">
                        Не удалось загрузить документ. Обратитесь к администратору.
                    </p>
                )}

                <div className="flex flex-col items-center gap-3">
                    {pages.map((src, i) => (
                        <div
                            key={i}
                            ref={(el) => (pageRefs.current[i] = el)}
                            data-page={i + 1}
                            className="shadow-xl shrink-0"
                            style={{ width: `${zoom}%` }}
                        >
                            <img
                                src={src}
                                alt={`Страница ${i + 1}`}
                                className="w-full block"
                                draggable="false"
                                onContextMenu={(e) => e.preventDefault()}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
