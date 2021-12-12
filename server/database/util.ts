export function parameterize(name: string, values: (string | number)[]) {
  const paramValues: { [name: string]: string | number } = {};
  for (let i = 0; i < values.length; i++) {
    paramValues[`${name}${i}`] = values[i];
  }
  const paramNames = Object.keys(paramValues).map((name) => `:${name}`);
  return { names: paramNames, values: paramValues };
}
