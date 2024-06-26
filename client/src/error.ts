const defaultMessages: Record<number, string> = {
	400: "Bad Request",
	401: "Unauthorized",
	403: "Forbidden",
	404: "Not Found",
	500: "Internal Server Error",
};

export class ResponseError extends Error {
	#status: number;
	#details: string | undefined;

	constructor(status: number, message?: string) {
		super(defaultMessages[status] || "Internal Server Error");
		this.#details = message;
		this.#status = status;
	}

	get status(): number {
		return this.#status;
	}

	get details(): string | undefined {
		return this.#details;
	}
}
