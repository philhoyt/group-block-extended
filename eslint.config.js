/**
 * ESLint flat config — extends the @wordpress/scripts default and adds the
 * Playwright rules for tests/e2e/.
 */
const baseConfig = require( '@wordpress/scripts/config/eslint.config.cjs' );
const wpPlugin = require( '@wordpress/eslint-plugin' );
const jestPlugin = require( 'eslint-plugin-jest' );

/**
 * Packages that webpack maps to the `wp.*` globals at build time
 * (DependencyExtractionWebpackPlugin). They are not npm dependencies of this
 * project, so tell eslint-plugin-import to treat them as built-ins.
 */
const WP_EXTERNALS = [
	'@wordpress/block-editor',
	'@wordpress/blocks',
	'@wordpress/components',
	'@wordpress/compose',
	'@wordpress/core-data',
	'@wordpress/data',
	'@wordpress/dom-ready',
	'@wordpress/element',
	'@wordpress/hooks',
	'@wordpress/i18n',
	'@wordpress/icons',
	'@wordpress/keycodes',
	'@wordpress/url',
];

module.exports = [
	{
		ignores: [ '.claude/**', 'lib/**', 'artifacts/**' ],
	},
	...baseConfig,
	{
		settings: {
			'import/core-modules': WP_EXTERNALS,
		},
		rules: {
			'import/no-unresolved': [ 'error', { ignore: [ '^@wordpress/' ] } ],
		},
	},
	...wpPlugin.configs[ 'test-playwright' ].map( ( c ) => ( {
		...c,
		files: [ 'tests/e2e/**/*.js' ],
	} ) ),
	// The unit suite stays on Jest (wp-scripts test-unit-jest); the default
	// test override in @wordpress/eslint-plugin 27+ targets Vitest instead.
	{
		...jestPlugin.configs[ 'flat/recommended' ],
		files: [ 'src/**/__tests__/**/*.js', 'src/**/*.test.js' ],
	},
];
