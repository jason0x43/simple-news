import { writable } from 'svelte/store';

type ToastType = 'normal' | 'good' | 'bad';

export type ToastOptions = {
	type?: ToastType;
	duration?: number;
};

type Toast = {
	id: string;
	message: string;
	type: ToastType;
};

export const toasts = writable<Toast[]>([]);

export function showToast(message: string, options?: ToastOptions) {
	const id = `${Math.random()}`;

	toasts.update((items) => [
		...items,
		{ id, message, type: options?.type ?? 'normal' }
	]);

	setTimeout(() => {
		toasts.update((items) => {
			const index = items.findIndex((item) => item.id === id);
			if (index !== -1) {
				return [...items.slice(0, index), ...items.slice(index + 1)];
			}
			return items;
		});
	}, options?.duration ?? 1000);
}
