import { useEffect, useRef, useState } from "react";

// Фильтр-комбобокс: то же поле ввода служит и отображением выбранного значения, и поиском —
// без отдельного всплывающего блока с собственным полем поиска. Стилизован как поле поиска
// на страницах «Документы»/«Сотрудники» (иконка лупы, кнопка очистки).
export default function SearchableSelect({ value, onChange, options, placeholder = "Все", className = "" }) {
    const [open, setOpen]   = useState(false);
    const [query, setQuery] = useState("");
    const rootRef  = useRef(null);
    const inputRef = useRef(null);

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

    function handleFocus() {
        setOpen(true);
        setQuery("");
    }

    function pick(val) {
        onChange(val);
        setOpen(false);
        setQuery("");
    }

    function clear(e) {
        e.stopPropagation();
        onChange("");
        setQuery("");
        setOpen(false);
        inputRef.current?.blur();
    }

    const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
                ref={inputRef}
                type="text"
                value={open ? query : (selected?.label ?? "")}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={handleFocus}
                placeholder={placeholder}
                className="w-full pl-8 pr-7 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selected && !open && (
                <button type="button" onClick={clear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    ×
                </button>
            )}

            {open && (
                <div className="absolute z-20 mt-1 w-full min-w-[180px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
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
            )}
        </div>
    );
}
