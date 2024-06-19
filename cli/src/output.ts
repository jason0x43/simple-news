export function printTable<T extends object>(
	items: T[],
	options?: { columns?: (keyof T)[]; showHeader?: boolean },
) {
	const termWidth = process.stdout.columns;

	const columns = options?.columns ?? (Object.keys(items[0]) as (keyof T)[]);
	const tableData = items.map((item) => {
		const row: Record<keyof T, string> = {} as Record<keyof T, string>;
		for (const col of columns) {
			row[col] = `${item[col]}`;
		}
		return row;
	});

	const columnWidths = new Array<number>(columns.length).fill(0);

	for (const row of tableData) {
		for (let i = 0; i < columns.length; i++) {
			if (row[columns[i]].length > columnWidths[i]) {
				columnWidths[i] = row[columns[i]].length;
			}
		}
	}

	const totalWidth =
		columnWidths.reduce((a, b) => a + b, 0) + columnWidths.length * 3 + 2;
	if (totalWidth > termWidth) {
		const delta = totalWidth - termWidth;
		columnWidths[columnWidths.length - 1] -= delta;
	}

	process.stdout.write(
		"╭" + columnWidths.map((cw) => "".padEnd(cw + 2, "─")).join("┬") + "╮\n",
	);

	if (options?.showHeader) {
		process.stdout.write(
			"│" +
				columns
					.map((col, i) => {
						const c = col as string;
						return ` ${c.padEnd(columnWidths[i])} `;
					})
					.join("│") +
				"│\n",
		);

		process.stdout.write(
			"├" + columnWidths.map((cw) => "".padEnd(cw + 2, "─")).join("┼") + "┤\n",
		);
	}

	for (const row of tableData) {
		process.stdout.write(
			"│" +
				columns
					.map((col, i) => {
						if (row[col].length <= columnWidths[i]) {
							return ` ${row[col].padEnd(columnWidths[i])} `
						}
						return ` ${row[col].slice(0, columnWidths[i] - 3)}... `
					})
					.join("│") +
				"│\n",
		);
	}

	process.stdout.write(
		"╰" + columnWidths.map((cw) => "".padEnd(cw + 2, "─")).join("┴") + "╯\n",
	);
}

export function printJson(
	data: object,
) {
	console.log(JSON.stringify(data, null, 2));
}

export function print(
	...args: unknown[]
) {
	console.log(...args);
}

export function printError(
	...args: unknown[]
) {
	console.error(...args);
}
