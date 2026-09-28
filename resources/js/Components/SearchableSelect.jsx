import { useEffect, useRef, useState } from "react";

// Выпадающий список с поиском по вводу — замена обычному <select>, когда вариантов много.
// options: [{ value, label }]. value/onChange — как у обычного select (value = "" значит "не выбрано").
export default function SearchableSelect({ value, onChange, options, placeholder = "Все", searchPlaceholder = "Поиск...", className = "" }) {
    const [open, setOpen]     = useState(false);
    const [query, setQuery]   = useState("");
    const rootRef             = useRef(null);
    const inputRef            = useRef(null);

    const selected = options.find((o) => String(o.value) === String(value));

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(e) {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
                setQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    function openDropdown() {
        setOpen(true);
        setQuery("");
        requestAnimationFrame(() => inputRef.current?.focus());
    }

    function pick(val) {
        onChange(val);
        setOpen(false);
        setQuery("");
    }

    const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => (open ? setOpen(false) : openDropdown())}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <span className={selected ? "text-gray-700" : "text-gray-400"}>
                    {selected ? selected.label : placeholder}
                </span>
                <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="absolute z-20 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full px-3 py-2 text-sm border-b border-gray-100 focus:outline-none"
                    />
                    <div className="max-h-56 overflow-y-auto">
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => pick("")}
                            className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${!value ? "text-blue-600 font-medium" : "text-gray-600"}`}
                        >
                            {placeholder}
                        </button>
                        {filtered.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-gray-400">Ничего не найдено</p>
                        ) : (
                            filtered.map((o) => (
                                <button
                                    key={o.value}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => pick(o.value)}
                                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 ${String(o.value) === String(value) ? "text-blue-600 font-medium" : "text-gray-700"}`}
                                >
                                    {o.label}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
