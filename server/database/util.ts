import { QueryParameterSet } from "../deps.ts";
import { query } from "./db.ts";

export function parameterize(name: string, values: (string | number)[]) {
  const paramValues: { [name: string]: string | number } = {};
  for (let i = 0; i < values.length; i++) {
    paramValues[`${name}${i}`] = values[i];
  }
  const paramNames = Object.keys(paramValues).map((name) => `:${name}`);
  return { names: paramNames, values: paramValues };
}

export type RowType<
  A,
  T extends { [i: number]: keyof A },
> = {
  -readonly [Index in keyof T]: T[Index] extends keyof A ? A[T[Index]] : never;
};

export function createRowHelpers<T>() {
  return <C extends readonly (keyof T)[]>(...columns: C) => {
    type Row = RowType<T, C>;

    const selector = columns.map((name) =>
      (name as string).replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    ).join(",");

    const rowToEntity = (row: Row): T => {
      const entity = {} as T;
      for (let i = 0; i < columns.length; i++) {
        const key = columns[i];
        entity[key] = row[i];
      }
      return entity;
    };

    return {
      columns: selector,
      rowToEntity,
      query: (q: string, params?: QueryParameterSet): T[] =>
        query<Row>(q, params).map(rowToEntity),
    };
  };
}

export function count(q: string, params?: QueryParameterSet): number {
  return query<[number]>(q, params)[0][0];
}

export function select<T>(
  q: string,
  selector: (row: unknown[]) => T,
  params?: QueryParameterSet,
): T[] {
  const rows = query(q, params);
  return rows.map(selector);
}
