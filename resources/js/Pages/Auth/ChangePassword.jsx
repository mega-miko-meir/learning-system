import { Head, useForm } from '@inertiajs/react';

export default function ChangePassword() {
    const { data, setData, post, processing, errors } = useForm({
        password: '',
        password_confirmation: '',
    });

    function submit(e) {
        e.preventDefault();
        post(route('password.change.post'));
    }

    return (
        <>
            <Head title="Смена пароля" />

            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 mb-4 shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Смена пароля</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Установите новый пароль для входа в систему
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <p className="text-sm text-amber-700">
                                Это первый вход в систему. Пожалуйста, установите надёжный пароль.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Новый пароль
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Минимум 8 символов"
                                    autoComplete="new-password"
                                    autoFocus
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                        ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                />
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
                                )}
                                <p className="mt-1.5 text-xs text-gray-400">
                                    Требования: минимум 8 символов, заглавная буква и цифра
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Повторите пароль
                                </label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Повторите новый пароль"
                                    autoComplete="new-password"
                                    className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                        ${errors.password_confirmation ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                />
                                {errors.password_confirmation && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.password_confirmation}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                                    text-white text-sm font-medium rounded-xl transition-colors
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                    disabled:cursor-not-allowed"
                            >
                                {processing ? 'Сохранение...' : 'Сохранить пароль'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
