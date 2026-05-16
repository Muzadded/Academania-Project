import path from 'node:path';

const rel = (workspace, files) =>
  files.map((file) => path.relative(workspace, file).replaceAll('\\', '/'));

export default {
  'frontend/**/*.{ts,tsx}': (files) => [
    {
      command: `node node_modules/eslint/bin/eslint.js --fix ${rel('frontend', files).join(' ')}`,
      cwd: 'frontend',
    },
    `prettier --write ${files.join(' ')}`,
  ],
  'Backend/**/*.ts': (files) => [
    {
      command: `node ../node_modules/eslint/bin/eslint.js --fix ${rel('Backend', files).join(' ')}`,
      cwd: 'Backend',
    },
    `prettier --write ${files.join(' ')}`,
  ],
  'shared/**/*.ts': (files) => `prettier --write ${files.join(' ')}`,
};
