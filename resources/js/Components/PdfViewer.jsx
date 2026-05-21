import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).href;

export default function PdfViewer({ url }) {
    const [pdf,         setPdf]         = useState(null);
    const [totalPages,  setTotalPages]  = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageInput,   setPageInput]   = useState("1");
    const [scale,       setScale]       = useState(1.0);
    const [status,      setStatus]      = useState("loading");
    const [rendering,   setRendering]   = useState(false);

    const canvasRef      = useRef(null);
    const containerRef   = useRef(null);
    const renderTaskRef  = useRef(null);
    const cancelRef      = useRef(false);

    // Загружаем PDF
    useEffect(() => {
        cancelRef.current = false;
        setStatus("loading");
        setPdf(null);
        setCurrentPage(1);
        setPageInput("1");
        setTotalPages(0);

        async function load() {
            try {
                const { data } = await window.axios.get(url, { responseType: "arraybuffer" });
                if (cancelRef.current) return;

                const doc = await pdfjsLib.getDocument({ data }).promise;
                if (cancelRef.current) return;

                setPdf(doc);
                setTotalPages(doc.numPages);
                setStatus("ready");
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

    // Подбираем масштаб "по ширине" после первой загрузки
    useEffect(() => {
        if (status !== "ready" || !pdf || !containerRef.current) return;
        pdf.getPage(1).then(page => {
            const vp = page.getViewport({ scale: 1 });
            const containerWidth = containerRef.current.clientWidth - 48;
            setScale(Math.min(Math.round((containerWidth / vp.width) * 100) / 100, 1.5));
        });
    }, [status, pdf]);

    // Рендерим страницу при смене страницы или масштаба
    useEffect(() => {
        if (!pdf || !canvasRef.current || status === "loading" || status === "error") return;

        async function renderPage() {
            setRendering(true);

            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
                renderTaskRef.current = null;
            }

            try {
                const page     = await pdf.getPage(currentPage);
                const viewport = page.getViewport({ scale });
                const canvas   = canvasRef.current;
                if (!canvas) return;

                canvas.width  = viewport.width;
                canvas.height = viewport.height;

                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const task = page.render({ canvasContext: ctx, viewport });
                renderTaskRef.current = task;
                await task.promise;
                renderTaskRef.current = null;
            } catch (err) {
                if (err.name !== "RenderingCancelledException") console.error(err);
            } finally {
                setRendering(false);
            }
        }

        renderPage();
    }, [pdf, currentPage, scale]);

    function goTo(n) {
        const p = Math.max(1, Math.min(n, totalPages));
        setCurrentPage(p);
        setPageInput(String(p));
    }

    function handlePageSubmit(e) {
        e.preventDefault();
        const n = parseInt(pageInput, 10);
        if (!isNaN(n)) goTo(n);
    }

    function zoomBy(delta) {
        setScale(prev => Math.round(Math.max(0.25, Math.min(prev + delta, 3)) * 100) / 100);
    }

    function fitWidth() {
        if (!pdf || !containerRef.current) return;
        pdf.getPage(currentPage).then(page => {
            const vp = page.getViewport({ scale: 1 });
            const w  = containerRef.current.clientWidth - 48;
            setScale(Math.min(Math.round((w / vp.width) * 100) / 100, 2));
        });
    }

    return (
        <div className="flex flex-col w-full h-full bg-gray-700">

            {/* Панель управления */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-gray-200 text-xs shrink-0 select-none flex-wrap">

                {/* Навигация по страницам */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => goTo(currentPage - 1)}
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

                    <span className="text-gray-400">/ {totalPages || "—"}</span>

                    <button
                        onClick={() => goTo(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 disabled:opacity-30 text-base leading-none"
                    >›</button>
                </div>

                <div className="w-px h-4 bg-gray-700 mx-1" />

                {/* Масштаб */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => zoomBy(-0.25)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-base font-bold"
                    >−</button>

                    <span className="w-12 text-center tabular-nums text-white">
                        {Math.round(scale * 100)}%
                    </span>

                    <button
                        onClick={() => zoomBy(0.25)}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 text-base font-bold"
                    >+</button>

                    <button
                        onClick={fitWidth}
                        className="px-2 py-1 rounded hover:bg-gray-700 text-xs text-gray-300 border border-gray-600 ml-1"
                    >
                        По ширине
                    </button>
                </div>

                {rendering && (
                    <span className="ml-auto text-gray-500 text-xs">Рендеринг…</span>
                )}
            </div>

            {/* Область страницы */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto p-6 flex justify-center items-start select-none bg-gray-600"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
            >
                {status === "loading" && (
                    <div className="flex flex-col items-center justify-center mt-20 text-gray-300 text-sm gap-3">
                        <div className="w-8 h-8 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                        Загрузка документа…
                    </div>
                )}

                {status === "error" && (
                    <p className="mt-20 text-red-300 text-sm">
                        Не удалось загрузить документ. Обратитесь к администратору.
                    </p>
                )}

                {(status === "ready" || status === "done") && (
                    <div className={`shadow-2xl transition-opacity duration-150 ${rendering ? "opacity-60" : "opacity-100"}`}>
                        <canvas ref={canvasRef} className="block" style={{ maxWidth: "none" }} />
                    </div>
                )}
            </div>
        </div>
    );
}
