// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
    expoConfig,
    {
        ignores: ['dist/*'],
        rules: {
            indent: ['warn', 4],
            'prettier/prettier': 'warn',
        },
    },
]);
