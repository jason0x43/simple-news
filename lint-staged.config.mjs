export default {
  'app/**/*': ['prettier --write'],
  'app/**/*.{ts,tsx}': (filenames) => [
    ...filenames.map((filename) => `eslint '${filename}'`),
    'tsc --noEmit',
  ],
};
