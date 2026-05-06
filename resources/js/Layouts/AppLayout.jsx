import { Link, usePage, router } from "@inertiajs/react";
import { useAuth, useFlash } from "../hooks/useAuth";
import { useEffect, useState } from "react";

const NAV_ITEMS = {
    superadmin: [
        { href: "superadmin.dashboard",  icon: "⊞", label: "Дашборд" },
        { href: "superadmin.users.index", icon: "👥", label: "Пользователи и роли" },
        { href: "superadmin.users.create", icon: "+", label: "Добавить пользователя" },
        // Суперадмин также видит весь функционал обычного админа
        { href: "admin.documents.index", icon: "📄", label: "Документы" },
        { href: "admin.matrix.index",    icon: "⊟", label: "Матрица обучения" },
        { href: "admin.tests.index",     icon: "✎", label: "Тесты" },
        { href: "admin.assignments.index", icon: "📋", label: "Назначения" },
        { href: "admin.departments.index", icon: "🏢", label: "Отделы" },
        { href: "admin.reports.index",   icon: "📊", label: "Отчёты" },
        { href: "admin.audit.index",     icon: "🔒", label: "Аудит" },
    ],
    admin: [
        { href: "admin.dashboard", icon: "⊞", label: "Дашборд" },
        { href: "admin.users.index", icon: "👥", label: "Сотрудники" },
        { href: "admin.documents.index", icon: "📄", label: "Документы" },
        { href: "admin.matrix.index", icon: "⊟", label: "Матрица обучения" },
        { href: "admin.tests.index", icon: "✎", label: "Тесты" },
        { href: "admin.assignments.index", icon: "📋", label: "Назначения" },
        { href: "admin.departments.index", icon: "🏢", label: "Отделы" },
        { href: "admin.reports.index", icon: "📊", label: "Отчёты" },
        { href: "admin.audit.index", icon: "🔒", label: "Аудит" },
    ],
    hr_admin: [
        { href: "hr.dashboard", icon: "⊞", label: "Главная" },
        { href: "hr.users.index", icon: "👥", label: "Сотрудники" },
        { href: "hr.departments.index", icon: "🏢", label: "Отделы" },
    ],
    manager: [
        { href: "manager.dashboard", icon: "⊞", label: "Главная" },
        { href: "manager.employees", icon: "👥", label: "Мои сотрудники" },
        { href: "manager.reports", icon: "📊", label: "Отчёты" },
    ],
    employee: [
        { href: "employee.dashboard", icon: "⊞", label: "Мой кабинет" },
        { href: "employee.assignments", icon: "📋", label: "Мои задания" },
    ],
};

const ROLE_LABELS = {
    superadmin: "Системный администратор",
    admin:      "Администратор",
    hr_admin:   "HR администратор",
    manager:    "Руководитель",
    employee:   "Сотрудник",
};

function FlashMessage() {
    const flash = useFlash();
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        setVisible(true);
        const t = setTimeout(() => setVisible(false), 4000);
        return () => clearTimeout(t);
    }, [flash]);

    if (!visible) return null;

    if (flash.success)
        return (
            <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-4">
                <span>✓</span> {flash.success}
            </div>
        );
    if (flash.error)
        return (
            <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-2">
                <span>✕</span> {flash.error}
            </div>
        );
    if (flash.info)
        return (
            <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
                {flash.info}
            </div>
        );
    return null;
}

export default function AppLayout({ children, title }) {
    const { user } = useAuth();
    const { url } = usePage();
    const navItems = NAV_ITEMS[user?.role] ?? [];

    function logout() {
        router.post(route("logout"));
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Боковая панель */}
            <aside className="w-60 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
                {/* Лого */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">📚</span>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">
                            Обучение
                        </p>
                        <p className="text-xs text-gray-400">
                            {ROLE_LABELS[user?.role]}
                        </p>
                    </div>
                </div>

                {/* Навигация */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ href, icon, label }) => {
                        const isActive = (() => {
                            try {
                                const routePath = new URL(route(href)).pathname.replace(/\/$/, "");
                                const currentPath = url.split("?")[0].replace(/\/$/, "");
                                // Дашборд и страницы создания — точное совпадение
                                if (href.endsWith(".dashboard") || href.endsWith(".create")) {
                                    return currentPath === routePath;
                                }
                                // Остальные — текущий URL совпадает или является подстраницей
                                return currentPath === routePath || currentPath.startsWith(routePath + "/");
                            } catch {
                                return false;
                            }
                        })();
                        return (
                            <Link
                                key={href}
                                href={route(href)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                                    isActive
                                        ? "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            >
                                <span className="text-base">{icon}</span>
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Пользователь + выход */}
                <div className="px-3 py-3 border-t border-gray-100">
                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-blue-700">
                                {user?.full_name?.charAt(0) ?? "?"}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 truncate">
                                {user?.short_name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                                {user?.department}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500
                            hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <span>→</span> Выйти
                    </button>
                </div>
            </aside>

            {/* Основной контент */}
            <main className="flex-1 overflow-y-auto">
                {title && (
                    <div className="px-8 py-6 border-b border-gray-100 bg-white">
                        <h1 className="text-xl font-bold text-gray-900">
                            {title}
                        </h1>
                    </div>
                )}
                <div className="px-8 py-6">{children}</div>
            </main>

            <FlashMessage />
        </div>
    );
}
