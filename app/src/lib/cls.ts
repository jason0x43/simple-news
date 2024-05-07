/**
 * A template tag for combining classes that have been split over multiple
 * lines.
 */
export function cls(strings: TemplateStringsArray, ...values: unknown[]) {
	const str = String.raw({ raw: strings }, ...values);
	return str.trim().split(/\s+/).join(" ");
}
