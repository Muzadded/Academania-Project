import path from 'node:path';

const rel = (workspace, files) =>
  files.map((file) => path.relative(workspace, file).replaceAll('\\', '/'));

export default {
  'frontend/**/*.{ts,tsx}': (files) => {
    const targets = rel('frontend', files)
      .map((file) => `"frontend/${file}"`)
      .join(' ');
    return [
      `node frontend/node_modules/eslint/bin/eslint.js --fix --resolve-plugins-relative-to frontend ${targets}`,
      `prettier --write ${files.map((f) => `"${f}"`).join(' ')}`,
    ];
  },
  'Backend/**/*.ts': (files) => {
    const targets = rel('Backend', files).join(' ');
    return [
      `npm exec -w @academania/backend -- eslint --fix ${targets}`,
      `prettier --write ${files.map((f) => `"${f}"`).join(' ')}`,
    ];
  },
  'shared/**/*.ts': (files) => `prettier --write ${files.map((f) => `"${f}"`).join(' ')}`,
};
