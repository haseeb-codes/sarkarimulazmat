/** Default delay for search boxes, filter text inputs, and sliders (ms). */
export const SEARCH_DEBOUNCE_MS = 300;

export function debounce<T extends (...args: never[]) => void>(
	fn: T,
	ms: number
): T & { cancel: () => void } {
	let timer: ReturnType<typeof setTimeout> | undefined;

	const debounced = ((...args: Parameters<T>) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), ms);
	}) as T & { cancel: () => void };

	debounced.cancel = () => {
		clearTimeout(timer);
		timer = undefined;
	};

	return debounced;
}
