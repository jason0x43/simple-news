const defaultMessages: Record<number, string> = {
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	500: "Internal Server Error",
};

export class ResponseError extends Error {
	#status: number;

	constructor(status: number, message?: string) {
		const parts = [`[${status}]`];
		if (message) {
			parts.push(message)
		} else if (defaultMessages[status]) {
			parts.push(defaultMessages[status])
		}

		super(parts.join(" "));
		this.#status = status;
	}

	get status(): number {
		return this.#status;
	}
}
