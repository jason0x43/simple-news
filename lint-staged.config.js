function prettify(filenames) {
  return filenames.map(
    (filename) => `prettier --write --plugin-search-dir=. '${filename}'`
  );
}

function lint(filenames) {
  return filenames.map((filename) => `eslint --fix '${filename}'`);
}

export default {
  '{src,scripts}/**/*.{ts,tsx}': (filenames) => [
    ...prettify(filenames),
    'tsc --noEmit',
    ...lint(filenames)
  ],
  'src/**/*.svelte': (filenames) => [
    ...prettify(filenames),
    'svelte-check --tsconfig ./tsconfig.json'
  ]
};
