import { color } from "./deps.ts";

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
  const lineRow = columnWidths.map((width) => "".padEnd(width + 2, "─"));
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

async function readSecret(): Promise<string | null> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const input: string[] = [];

  while (true) {
    const data = new Uint8Array(1);
    const numBytes = await Deno.stdin.read(data);
    if (numBytes === null) {
      break;
    }

    const string = decoder.decode(data.slice(0, numBytes));

    for (const char of string) {
      switch (char) {
        case "\u0003": // end-of-text
        case "\u0004": // end-of-transmission
          return null;

        case "\r":
        case "\n":
          return input.join('');

        case "\u0008": // backspace
        case "\u007f": // delete
          if (input.length > 0) {
            Deno.stdout.write(encoder.encode('\b \b'));
          }
          input.pop();
          break;

        default:
          Deno.stdout.write(encoder.encode('*'));
          input.push(char);
          break;
      }
    }
  }

  return null;
}

export async function promptSecret(prompt: string): Promise<string | null> {
  const encoder = new TextEncoder();
  Deno.stdout.write(encoder.encode(prompt));
  Deno.setRaw(0, true);
  const secret = await readSecret();
  Deno.setRaw(Deno.stdin.rid, false);
  Deno.stdout.write(encoder.encode('\n'));
  return secret;
}
