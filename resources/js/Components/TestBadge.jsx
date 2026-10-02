// Бейдж «С тестом» / «Без теста» для списков назначений — показывает сразу,
// нужно ли будет сдавать экзамен после изучения материала, или обучение
// завершится автоматически по факту прочтения.
export default function TestBadge({ hasTest }) {
    return hasTest ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 whitespace-nowrap">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            С тестом
        </span>
    ) : (
        <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap">
            Без теста
        </span>
    );
}
