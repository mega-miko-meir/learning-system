import { usePage } from '@inertiajs/react';

export function useAuth() {
    const { auth } = usePage().props;
    return { user: auth?.user ?? null };
}

export function useFlash() {
    const { flash } = usePage().props;
    return flash ?? {};
}
