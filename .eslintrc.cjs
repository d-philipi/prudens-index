/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  ignorePatterns: ['node_modules/', 'dist/', '.next/', 'build/'],
  env: { node: true, es2022: true },
};
