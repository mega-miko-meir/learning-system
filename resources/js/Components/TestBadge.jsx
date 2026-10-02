// Пометка о тесте в списках назначений — одинаковая везде (сотрудник, админка, отчёты),
// чтобы не было расхождений в формулировках.
// has_test (обычное обучение с тестом) — без пометок, это стандартное поведение.
// no_test_required — админ осознанно поставил «Без теста».
// test_missing — документ должен иметь тест, но админ его ещё не прикрепил (ошибка
// конфигурации, не осознанный выбор). Сотрудника это не блокирует — он читает и завершает
// так же, как «Без теста» (см. AssignmentController::heartbeat), но помечаем отдельно и ему
// тоже, чтобы не было двух разных смыслов под одной и той же меткой.
export default function TestBadge({ testStatus }) {
    if (!testStatus || testStatus === "has_test") {
        return null;
    }

    if (testStatus === "test_missing") {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 whitespace-nowrap">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Тест не прикреплён
            </span>
        );
    }

    return (
        <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap">
            Без теста
        </span>
    );
}
