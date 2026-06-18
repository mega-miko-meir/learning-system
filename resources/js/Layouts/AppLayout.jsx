import { Link, usePage, router } from "@inertiajs/react";
import { useAuth, useFlash } from "../hooks/useAuth";
import { useEffect, useState } from "react";

function Icon({ d, d2 }) {
    return (
        <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d={d} />
            {d2 && <path d={d2} />}
        </svg>
    );
}

// Heroicons v2 outline
const ICONS = {
    dashboard:   <Icon d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />,
    users:       <Icon d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
    userPlus:    <Icon d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766z" />,
    document:    <Icon d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
    matrix:      <Icon d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />,
    tests:       <Icon d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />,
    assignments: <Icon d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />,
    department:  <Icon d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />,
    positions:   <Icon d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />,
    reports:     <Icon d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />,
    audit:       <Icon d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
};

const NAV_ITEMS = {
    superadmin: [
        { href: "superadmin.dashboard",    icon: ICONS.dashboard,   label: "Дашборд" },
        { href: "superadmin.users.index",  icon: ICONS.users,       label: "Пользователи и роли" },
        { href: "superadmin.users.create", icon: ICONS.userPlus,    label: "Добавить пользователя" },
        { href: "admin.documents.index",   icon: ICONS.document,    label: "Документы" },
        { href: "admin.matrix.index",      icon: ICONS.matrix,      label: "Матрица обучения" },
        { href: "admin.tests.index",       icon: ICONS.tests,       label: "Тесты" },
        { href: "admin.assignments.index", icon: ICONS.assignments,  label: "Назначения" },
        { href: "admin.departments.index", icon: ICONS.department,  label: "Отделы" },
        { href: "admin.positions.index",   icon: ICONS.positions,   label: "Должности" },
        { href: "admin.reports.index",     icon: ICONS.reports,     label: "Отчёты" },
        { href: "admin.audit.index",       icon: ICONS.audit,       label: "Аудит" },
    ],
    admin: [
        { href: "admin.dashboard",         icon: ICONS.dashboard,   label: "Дашборд" },
        { href: "admin.users.index",       icon: ICONS.users,       label: "Сотрудники" },
        { href: "admin.documents.index",   icon: ICONS.document,    label: "Документы" },
        { href: "admin.matrix.index",      icon: ICONS.matrix,      label: "Матрица обучения" },
        { href: "admin.tests.index",       icon: ICONS.tests,       label: "Тесты" },
        { href: "admin.assignments.index", icon: ICONS.assignments,  label: "Назначения" },
        { href: "admin.departments.index", icon: ICONS.department,  label: "Отделы" },
        { href: "admin.positions.index",   icon: ICONS.positions,   label: "Должности" },
        { href: "admin.reports.index",     icon: ICONS.reports,     label: "Отчёты" },
        { href: "admin.audit.index",       icon: ICONS.audit,       label: "Аудит" },
    ],
    hr_admin: [
        { href: "hr.dashboard",            icon: ICONS.dashboard,   label: "Главная" },
        { href: "hr.users.index",          icon: ICONS.users,       label: "Сотрудники" },
        { href: "hr.departments.index",    icon: ICONS.department,  label: "Отделы" },
        { href: "hr.positions.index",      icon: ICONS.positions,   label: "Должности" },
    ],
    manager: [
        { href: "manager.dashboard",       icon: ICONS.dashboard,   label: "Главная" },
        { href: "manager.employees",       icon: ICONS.users,       label: "Мои сотрудники" },
        { href: "manager.reports",         icon: ICONS.reports,     label: "Отчёты" },
        { href: "employee.dashboard",      icon: ICONS.assignments, label: "Моё обучение" },
    ],
    employee: [
        { href: "employee.dashboard",      icon: ICONS.dashboard,   label: "Мой кабинет" },
        { href: "employee.assignments",    icon: ICONS.assignments,  label: "Мои задания" },
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

export default function AppLayout({ children, title, fullHeight = false }) {
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
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                        </svg>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">Обучение</p>
                        <p className="text-xs text-gray-400">{ROLE_LABELS[user?.role]}</p>
                    </div>
                </div>

                {/* Навигация */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navItems.map(({ href, icon, label }) => {
                        const isActive = (() => {
                            try {
                                const routePath = new URL(route(href)).pathname.replace(/\/$/, "");
                                const currentPath = url.split("?")[0].replace(/\/$/, "");
                                if (href.endsWith(".dashboard") || href.endsWith(".create")) {
                                    return currentPath === routePath;
                                }
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
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
                                }`}
                            >
                                {icon}
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
                            <p className="text-xs font-medium text-gray-900 truncate">{user?.short_name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.department}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Выйти
                    </button>
                </div>
            </aside>

            {/* Основной контент */}
            <main className={`flex-1 min-w-0 flex flex-col ${fullHeight ? "overflow-hidden" : "overflow-y-auto"}`}>
                {title && (
                    <div className="px-8 py-6 border-b border-gray-100 bg-white shrink-0">
                        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                    </div>
                )}
                <div className={fullHeight ? "flex flex-col flex-1 min-h-0" : "px-8 py-6"}>
                    {children}
                </div>
            </main>

            <FlashMessage />
        </div>
    );
}
