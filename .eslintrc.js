module.exports = {
	extends: [ 'plugin:@wordpress/eslint-plugin/recommended' ],
	ignorePatterns: [
		'.claude/**',
		'build/**',
		'lib/**',
		'vendor/**',
		'node_modules/**',
	],
	rules: {
		// Project-specific overrides
	},
	overrides: [
		{
			files: [ '**/__tests__/**/*.js', '**/*.test.js' ],
			extends: [ 'plugin:@wordpress/eslint-plugin/test-unit' ],
		},
		{
			files: [ 'tests/e2e/**/*.js' ],
			extends: [ 'plugin:@wordpress/eslint-plugin/test-playwright' ],
		},
	],
};
