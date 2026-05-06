import { Head, useForm } from "@inertiajs/react";
import { useState } from "react";

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        login: "",
        password: "",
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    // Определяем тип логина на лету для подсказки пользователю
    const loginType = (() => {
        const v = data.login.trim();
        if (!v) return null;
        if (/^[\+\d][\d\s\-\(\)]{3,}$/.test(v)) return "phone";
        if (v.includes("@")) return "email";
        return null;
    })();

    function submit(e) {
        e.preventDefault();
        post(route("login.post"));
    }

    return (
        <>
            <Head title="Вход в систему" />

            <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <div className="w-full max-w-md">
                    {/* Логотип / заголовок */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg">
                            <svg
                                className="w-7 h-7 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Система обучения
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Войдите в свой аккаунт
                        </p>
                    </div>

                    {/* Карточка формы */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <form onSubmit={submit} className="space-y-5">
                            {/* Поле логина */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Логин
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={data.login}
                                        onChange={(e) =>
                                            setData("login", e.target.value)
                                        }
                                        placeholder="Телефон или Email"
                                        autoComplete="username"
                                        autoFocus
                                        className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-colors
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            ${
                                                errors.login
                                                    ? "border-red-300 bg-red-50"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            }`}
                                    />
                                    {/* Индикатор типа логина */}
                                    {loginType && (
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                            {loginType === "phone"
                                                ? "📱 Сотрудник"
                                                : "✉️ Руководитель / Админ"}
                                        </span>
                                    )}
                                </div>
                                {errors.login && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.login}
                                    </p>
                                )}
                                <p className="mt-1.5 text-xs text-gray-400">
                                    Сотрудники входят по номеру телефона,
                                    руководители и администраторы — по email
                                </p>
                            </div>

                            {/* Поле пароля */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Пароль
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        value={data.password}
                                        onChange={(e) =>
                                            setData("password", e.target.value)
                                        }
                                        placeholder="Введите пароль"
                                        autoComplete="current-password"
                                        className={`w-full px-4 py-2.5 pr-10 rounded-xl border text-sm transition-colors
                                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                                            ${
                                                errors.password
                                                    ? "border-red-300 bg-red-50"
                                                    : "border-gray-200 bg-white hover:border-gray-300"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showPassword ? (
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"
                                                />
                                            </svg>
                                        ) : (
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Запомнить */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={data.remember}
                                    onChange={(e) =>
                                        setData("remember", e.target.checked)
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label
                                    htmlFor="remember"
                                    className="text-sm text-gray-600 cursor-pointer"
                                >
                                    Запомнить меня
                                </label>
                            </div>

                            {/* Кнопка входа */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                                    text-white text-sm font-medium rounded-xl transition-colors
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                    disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg
                                            className="animate-spin w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                            />
                                        </svg>
                                        Вход...
                                    </span>
                                ) : (
                                    "Войти"
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Подсказка для забытого пароля */}
                    <p className="text-center text-xs text-gray-400 mt-6">
                        Забыли пароль? Обратитесь к администратору или
                        HR-специалисту.
                    </p>
                </div>
            </div>
        </>
    );
}
