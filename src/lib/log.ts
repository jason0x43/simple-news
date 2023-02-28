const levels = {
	debug: 3,
	info: 2,
	warn: 1,
	error: 0
} as const;

type LogLevel = keyof typeof levels;

let globalLevel: LogLevel = 'warn';

function log(
	logFunc: LogLevel,
	level: LogLevel | undefined,
	...args: unknown[]
): void {
	if (levels[level ?? globalLevel] < levels[logFunc]) {
		return;
	}
	const now = new Date();
	const logger = console[logFunc];
	logger(`[${now.toISOString()}]`, ...args);
}

export function createLog(level?: LogLevel) {
	return {
		debug: function (...args: unknown[]): void {
			log('debug', level, ...args);
		},

		info: function (...args: unknown[]): void {
			log('info', level, ...args);
		},

		warn: function (...args: unknown[]): void {
			log('warn', level, ...args);
		},

		error: function (...args: unknown[]): void {
			log('error', level, ...args);
		}
	};
}

export default createLog();

export function setLevel(level: LogLevel) {
	globalLevel = level;
}
