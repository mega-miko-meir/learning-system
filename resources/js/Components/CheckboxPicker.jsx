import { useMemo, useState } from "react";

// Единый паттерн выбора чекбоксами (сотрудники/документы/должности), впервые собранный
// для матрицы обучения — переиспользуется в «Назначениях» и карточке сотрудника,
// чтобы UX массового выбора был одинаковым во всей системе.

function SelectableRow({ item, checked, onToggle, renderItem, large }) {
    return (
        <label
            className={`flex items-start gap-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-0 ${large ? "px-4 py-3 text-sm" : "px-3 py-2.5 text-sm"} ${checked ? "bg-blue-50" : ""}`}>
            <input type="checkbox" checked={checked} onChange={onToggle}
                className={`mt-0.5 accent-blue-600 shrink-0 ${large ? "w-5 h-5" : "w-4 h-4"}`} />
            <span className="leading-snug">{renderItem(item)}</span>
        </label>
    );
}

// Компактный список с поиском, встраиваемый прямо в форму (max-h-80).
export function CheckboxList({ items, selectedIds, onToggle, onToggleAll, search, onSearch, searchPlaceholder, renderItem, emptyText, error, onExpand }) {
    const allSelected = items.length > 0 && items.every((i) => selectedIds.includes(i.id));
    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-gray-600">
                    {selectedIds.length > 0 && (
                        <span className="text-blue-600">({selectedIds.length} выбрано)</span>
                    )}
                </span>
                <div className="flex items-center gap-3">
                    {items.length > 0 && (
                        <button type="button" onClick={() => onToggleAll(allSelected, items)}
                            className="text-xs text-blue-500 hover:text-blue-700">
                            {allSelected ? "Снять все" : "Выбрать все"}
                        </button>
                    )}
                    {onExpand && (
                        <button type="button" onClick={onExpand}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            Развернуть
                        </button>
                    )}
                </div>
            </div>
            <input type="text" value={search} onChange={(e) => onSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {items.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">{search ? "Ничего не найдено" : emptyText}</p>
            ) : (
                <div className={`border rounded-lg overflow-hidden max-h-80 overflow-y-auto ${error ? "border-red-300" : "border-gray-200"}`}>
                    {items.map((item) => (
                        <SelectableRow key={item.id} item={item} checked={selectedIds.includes(item.id)}
                            onToggle={() => onToggle(item.id)} renderItem={renderItem} />
                    ))}
                </div>
            )}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

// Полноразмерный модальный пикер — «Развернуть» для массового выбора из сотен элементов.
export function PickerModal({ title, items, selectedIds, onToggle, onToggleAll, renderItem, matchesSearch, searchPlaceholder, emptyText, onClose }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        if (!search.trim()) return items;
        return items.filter((i) => matchesSearch(i, search));
    }, [items, search, matchesSearch]);

    const allFilteredSelected = filtered.length > 0 && filtered.every((i) => selectedIds.includes(i.id));

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl h-[85vh] shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {selectedIds.length > 0 ? `Выбрано: ${selectedIds.length}` : "Ничего не выбрано"}
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-3 border-b border-gray-100 shrink-0 flex items-center gap-3">
                    <input type="text" autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    {filtered.length > 0 && (
                        <button type="button" onClick={() => onToggleAll(allFilteredSelected, filtered)}
                            className="shrink-0 text-sm text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap">
                            {allFilteredSelected ? "Снять все" : `Выбрать все (${filtered.length})`}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-gray-400 py-12 text-center">
                            {search ? "Ничего не найдено" : emptyText}
                        </p>
                    ) : (
                        filtered.map((item) => (
                            <SelectableRow key={item.id} item={item} checked={selectedIds.includes(item.id)}
                                onToggle={() => onToggle(item.id)} renderItem={renderItem} large />
                        ))
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 shrink-0 flex justify-end">
                    <button type="button" onClick={onClose}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                        Готово{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
                    </button>
                </div>
            </div>
        </div>
    );
}
