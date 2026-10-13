import { Head, useForm, usePage } from "@inertiajs/react";

const NAV_SCALE = [1, 2, 3, 4, 5];

function Field({ label, children }) {
    return (
        <div className="space-y-2">
            <p className="text-sm font-medium text-gray-800">{label}</p>
            {children}
        </div>
    );
}

function ChoiceRow({ name, options, value, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt}
                    type="button"
                    onClick={() => onChange(opt)}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                        value === opt
                            ? "bg-blue-50 border-blue-500 text-blue-700"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

function Comment({ value, onChange, placeholder }) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full border border-gray-200 rounded-xl text-sm px-3.5 py-2.5 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    );
}

export default function Create() {
    const { submitted } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        nav_rating: null,
        nav_comment: "",
        had_issues: null,
        issue_description: "",
        timer_buttons_ok: null,
        timer_buttons_comment: "",
        retry_clarity: null,
        retry_comment: "",
        liked: "",
        difficulties: "",
        suggestions: "",
    });

    function submit(e) {
        e.preventDefault();
        post(route("pilot-feedback.store"), {
            onSuccess: () => reset(),
        });
    }

    if (submitted) {
        return (
            <>
                <Head title="Спасибо за отзыв" />
                <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <h1 className="text-lg font-bold text-gray-900 mb-2">Спасибо за отзыв</h1>
                        <p className="text-sm text-gray-500">
                            Мы изучим все ответы и учтём их перед тем, как открыть обучение для всех сотрудников.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Отзыв о пилоте обучения" />
            <div className="min-h-screen bg-slate-50 px-4 py-10">
                <div className="w-full max-w-xl mx-auto">
                    <header className="mb-7">
                        <span className="inline-block text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full mb-3">
                            Пилот системы обучения
                        </span>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Как прошло тестирование новой программы?
                        </h1>
                        <p className="text-sm text-gray-500">
                            Помогите нам понять, что работает хорошо, а что нужно доработать.
                        </p>
                    </header>

                    <form onSubmit={submit} className="space-y-4">
                        {/* Блок 1 */}
                        <section className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                            <div className="flex items-baseline gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">1</span>
                                <h2 className="font-bold text-gray-900">Вход и навигация</h2>
                            </div>

                            <Field label="Насколько интуитивно понятна навигация — вход в систему, список заданий, переходы между экранами?">
                                <div className="flex gap-1.5">
                                    {NAV_SCALE.map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setData("nav_rating", n)}
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                                                data.nav_rating === n
                                                    ? "bg-blue-600 border-blue-600 text-white"
                                                    : "bg-slate-50 border-gray-200 text-gray-500 hover:border-gray-300"
                                            }`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>1 — было сложно разобраться</span>
                                    <span>5 — всё сразу понятно</span>
                                </div>
                                <Comment
                                    value={data.nav_comment}
                                    onChange={(v) => setData("nav_comment", v)}
                                    placeholder="Комментарий, если есть что добавить"
                                />
                            </Field>
                        </section>

                        {/* Блок 2 */}
                        <section className="bg-white border border-gray-100 rounded-2xl p-5 space-y-5">
                            <div className="flex items-baseline gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">2</span>
                                <h2 className="font-bold text-gray-900">Технические проблемы</h2>
                            </div>

                            <Field label="Возникали ли технические ошибки, сбои или проблемы с загрузкой страниц, документа или теста?">
                                <ChoiceRow
                                    options={["Да", "Нет"]}
                                    value={data.had_issues}
                                    onChange={(v) => setData("had_issues", v)}
                                />
                                <Comment
                                    value={data.issue_description}
                                    onChange={(v) => setData("issue_description", v)}
                                    placeholder="Что произошло и на каком этапе (вход, задания, документ, таймер, тест)"
                                />
                            </Field>

                            <Field label="Таймер чтения и кнопки на сайте работали так, как вы ожидали?">
                                <ChoiceRow
                                    options={["Да", "Было не так"]}
                                    value={data.timer_buttons_ok}
                                    onChange={(v) => setData("timer_buttons_ok", v)}
                                />
                                <Comment
                                    value={data.timer_buttons_comment}
                                    onChange={(v) => setData("timer_buttons_comment", v)}
                                    placeholder="Что именно пошло не так"
                                />
                            </Field>

                            <Field label="Если тест не сдавался с первой попытки — было понятно, сколько попыток осталось?">
                                <ChoiceRow
                                    options={["Да, было понятно", "Было непонятно"]}
                                    value={data.retry_clarity}
                                    onChange={(v) => setData("retry_clarity", v)}
                                />
                                <Comment
                                    value={data.retry_comment}
                                    onChange={(v) => setData("retry_comment", v)}
                                    placeholder="Комментарий"
                                />
                            </Field>
                        </section>

                        {/* Блок 3 */}
                        <section className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                            <div className="flex items-baseline gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">3</span>
                                <h2 className="font-bold text-gray-900">Общее впечатление и предложения</h2>
                            </div>

                            <Field label="Что больше всего понравилось в программе?">
                                <Comment value={data.liked} onChange={(v) => setData("liked", v)} />
                            </Field>
                            <Field label="Что вызвало наибольшие трудности?">
                                <Comment value={data.difficulties} onChange={(v) => setData("difficulties", v)} />
                            </Field>
                            <Field label="Пожелания, идеи и рекомендации по улучшению программы">
                                <Comment value={data.suggestions} onChange={(v) => setData("suggestions", v)} />
                            </Field>
                        </section>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm transition-colors"
                        >
                            {processing ? "Отправляем…" : "Отправить отзыв"}
                        </button>
                        {Object.keys(errors).length > 0 && (
                            <p className="text-center text-sm text-red-600">Проверьте форму и попробуйте снова.</p>
                        )}
                    </form>
                </div>
            </div>
        </>
    );
}
