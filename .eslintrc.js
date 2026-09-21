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
};
