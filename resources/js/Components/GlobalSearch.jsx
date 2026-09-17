import { router } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";

const GROUP_LABELS = {
    employees: "Сотрудники",
    documents: "Документы",
    positions: "Должности",
    nav:       "Разделы",
};

function normalize(s) {
    return (s ?? "").toLowerCase();
}

// Инпут виден сразу в сайдбаре (не модалка) — клик или Ctrl+K/Cmd+K ставит в него фокус,
// результаты появляются в поповере под полем по мере ввода. См. SearchController за область/права.
export default function GlobalSearch({ navItems }) {
    const [query, setQuery]     = useState("");
    const [focused, setFocused] = useState(false);
    const [remote, setRemote]   = useState({ employees: [], documents: [], positions: [] });
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const inputRef     = useRef(null);
    const containerRef = useRef(null);
    const debounceRef  = useRef(null);

    // Ctrl+K / Cmd+K фокусирует поле поиска из любого места страницы.
    useEffect(() => {
        function onKeyDown(e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                inputRef.current?.focus();
                inputRef.current?.select();
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    // Клик вне поля/поповера закрывает выдачу.
    useEffect(() => {
        function onMouseDown(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setFocused(false);
            }
        }
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, []);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        const q = query.trim();
        if (q.length < 2) {
            setRemote({ employees: [], documents: [], positions: [] });
            setLoading(false);
            return;
        }
        setLoading(true);
        debounceRef.current = setTimeout(() => {
            window.axios.get(route("search"), { params: { q } })
                .then((res) => setRemote(res.data))
                .catch(() => setRemote({ employees: [], documents: [], positions: [] }))
                .finally(() => setLoading(false));
        }, 250);
        return () => clearTimeout(debounceRef.current);
    }, [query]);

    const navMatches = useMemo(() => {
        const q = normalize(query.trim());
        if (!q) return navItems;
        return navItems.filter((n) => normalize(n.label).includes(q));
    }, [navItems, query]);

    const groups = useMemo(() => {
        const g = [];
        if (remote.employees?.length) g.push({ key: "employees", items: remote.employees });
        if (remote.documents?.length) g.push({ key: "documents", items: remote.documents });
        if (remote.positions?.length) g.push({ key: "positions", items: remote.positions });
        if (navMatches.length)        g.push({ key: "nav", items: navMatches.map((n) => ({
            id: n.href, title: n.label, subtitle: null, url: route(n.href),
        })) });
        return g;
    }, [navMatches, remote]);

    const flatItems = useMemo(() => groups.flatMap((g) => g.items), [groups]);

    useEffect(() => {
        setActiveIndex(0);
    }, [flatItems.length]);

    function go(url) {
        setFocused(false);
        setQuery("");
        inputRef.current?.blur();
        router.visit(url);
    }

    function handleKeyDown(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            setFocused(false);
            inputRef.current?.blur();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, flatItems.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const item = flatItems[activeIndex];
            if (item) go(item.url);
        }
    }

    let runningIndex = -1;

    return (
        <div ref={containerRef} className="relative px-3 pt-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                focused ? "border-blue-300 bg-white ring-2 ring-blue-100" : "border-transparent bg-gray-50 hover:bg-gray-100"
            }`}>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Поиск..."
                    className="flex-1 min-w-0 bg-transparent outline-none placeholder:text-gray-400 text-gray-700"
                />
                {loading && (
                    <svg className="w-3.5 h-3.5 text-gray-300 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                )}
            </div>

            {focused && (
                <div className="absolute z-50 left-3 top-full mt-1.5 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-gray-100 shadow-2xl overflow-hidden">
                    <div className="max-h-[70vh] overflow-y-auto">
                        {groups.length === 0 ? (
                            <p className="px-4 py-6 text-sm text-gray-400 text-center">
                                {query.trim().length === 1 ? "Введите ещё символ..." : "Ничего не найдено"}
                            </p>
                        ) : groups.map((g) => (
                            <div key={g.key} className="py-2">
                                <p className="px-4 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                                    {GROUP_LABELS[g.key]}
                                </p>
                                {g.items.map((item) => {
                                    runningIndex++;
                                    const idx = runningIndex;
                                    const active = idx === activeIndex;
                                    return (
                                        <button
                                            key={`${g.key}-${item.id}`}
                                            type="button"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            onClick={() => go(item.url)}
                                            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left ${active ? "bg-blue-50" : "hover:bg-gray-50"}`}
                                        >
                                            <span className="min-w-0">
                                                <span className={`block text-sm truncate ${active ? "text-blue-700 font-medium" : "text-gray-800"}`}>
                                                    {item.title}
                                                </span>
                                                {item.subtitle && (
                                                    <span className="block text-xs text-gray-400 truncate">{item.subtitle}</span>
                                                )}
                                            </span>
                                            {active && (
                                                <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                                </svg>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 border-t border-gray-100 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1">↑↓</kbd> навигация</span>
                        <span className="flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1">↵</kbd> открыть</span>
                        <span className="flex items-center gap-1"><kbd className="border border-gray-200 rounded px-1">Esc</kbd> закрыть</span>
                    </div>
                </div>
            )}
        </div>
    );
}
