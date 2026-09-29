import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).href;

// Раньше ширина страницы на экране считалась как % от ширины контейнера (который часто шире,
// чем реальное разрешение отрендеренной картинки) — из-за этого страница растягивалась сверх
// своего фактического разрешения и получалась размытой/блочной независимо от того, насколько
// детально её отрендерил pdf.js. Теперь 100% зума = ровно BASE_DISPLAY_WIDTH CSS-пикселей вне
// зависимости от ширины контейнера, а растеризация делается с запасом (BASE_DISPLAY_WIDTH ×
// devicePixelRatio экрана), поэтому картинка на экране никогда не увеличивается сверх своего
// реального разрешения — только уменьшается (что всегда чётко) при узком экране/при зуме < 100%.
const BASE_DISPLAY_WIDTH = 850; // ширина страницы в CSS-пикселях при 100% — как одна страница A4/Letter на экране
const MAX_DEVICE_SCALE   = 1.5; // ограничение сверху — вместе с SUPERSAMPLE иначе страницы станут слишком тяжёлыми
// Рендерим страницу в 2 раза крупнее, чем нужно для показа, и отдаём финальное уменьшение браузеру
// (через CSS-ширину <img>) — сглаживает блочность JPEG-сжатия вложенных сканов (штампы, подписи),
// которую даёт собственное уменьшение изображений внутри pdf.js при рендере в canvas.
const SUPERSAMPLE = 2;
const DEFAULT_ZOOM = 100;

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
                const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_SCALE);

                for (let n = 1; n <= pdf.numPages; n++) {
                    if (cancelRef.current) return;

                    const page = await pdf.getPage(n);

                    // Масштаб подбирается так, чтобы BASE_DISPLAY_WIDTH CSS-пикселей (размер
                    // страницы при 100% зума) совпал с devicePixelRatio физических пикселей,
                    // умноженный на SUPERSAMPLE: рендерим с запасом по разрешению и отдаём
                    // финальное уменьшение браузеру (через CSS-ширину <img>) — у него сглаживание
                    // при уменьшении обычно заметно лучше, чем у внутреннего масштабирования
                    // вложенных растровых изображений (сканы штампов/подписей) в самом pdf.js —
                    // без запаса на них были видны блоки JPEG-сжатия.
                    const nativeWidth = page.getViewport({ scale: 1 }).width; // ширина страницы в pt PDF
                    const renderScale = (BASE_DISPLAY_WIDTH / nativeWidth) * dpr * SUPERSAMPLE;
                    const viewport    = page.getViewport({ scale: renderScale });

                    canvas.width  = viewport.width;
                    canvas.height = viewport.height;

                    const ctx = canvas.getContext("2d");
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    await page.render({ canvasContext: ctx, viewport }).promise;

                    if (cancelRef.current) return;

                    collected.push({
                        src:   canvas.toDataURL("image/png"),
                        width: viewport.width / (dpr * SUPERSAMPLE), // CSS-ширина страницы при zoom = 100%
                    });
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

    function resetZoom() {
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
                        onClick={resetZoom}
                        className="px-2 py-1 rounded hover:bg-gray-700 text-xs text-gray-300 border border-gray-600 ml-1"
                    >
                        Сброс
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
                    {pages.map((p, i) => (
                        <div
                            key={i}
                            ref={(el) => (pageRefs.current[i] = el)}
                            data-page={i + 1}
                            className="shadow-xl shrink-0"
                            style={{ width: `${p.width * (zoom / 100)}px` }}
                        >
                            <img
                                src={p.src}
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
