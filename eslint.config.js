// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions é Deno (outro runtime); scratch e .venv não são código do app.
    ignores: ['dist/*', 'supabase/*', 'scratch/*', '.venv/*', '.expo/*'],
  },
]);
