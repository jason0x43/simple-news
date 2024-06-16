export type AppErrorType = "not-authorized";

export class AppError extends Error {
	status: number | undefined;

	constructor(message: string, status?: number) {
		super(message);
		this.status = status;
	}

	toString() {
		return this.message;
	}
}
