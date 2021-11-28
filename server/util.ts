import { color } from './deps.ts';

export function printTable(rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    return;
  }

  const columnNames = Object.keys(rows[0]);
  const columnWidths = columnNames.map((name) => name.length);
  const columnAligns = Object.values(rows[0]).map((val) =>
    typeof val === "number" ? "right" : "left"
  );
  const tableRows: string[][] = [];

  for (const row of rows) {
    const tableRow = Object.values(row).map((val) => `${val}`);
    tableRows.push(tableRow);
    for (let i = 0; i < tableRow.length; i++) {
      columnWidths[i] = Math.max(columnWidths[i], tableRow[i].length);
    }
  }

  const nameRow = columnNames.map((name, i) => name.padEnd(columnWidths[i]));
  console.log(` ${nameRow.join(" │ ")} `);
  const lineRow = columnWidths.map((width) =>  ''.padEnd(width + 2, '─'));
  console.log(lineRow.join("┼"));

  tableRows.forEach((row, i) => {
    const printRow = row.map((col, i) => {
      const width = columnWidths[i];
      return columnAligns[i] === "right"
        ? col.padStart(width)
        : col.padEnd(width);
    });
    const text = ` ${printRow.join(" │ ")} `;
    if (i % 2 === 0) {
      console.log(text);
    } else {
      console.log(color.bgBlack(text));
    }
  });
}
