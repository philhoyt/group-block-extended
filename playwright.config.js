/**
 * Playwright config — extends the @wordpress/scripts default and points it at
 * this project's tests directory. WP_BASE_URL should match the wp-env tests
 * site (default http://localhost:8889; see .wp-env.override.json if changed).
 */
const path = require( 'path' );
const { defineConfig } = require( '@playwright/test' );
const baseConfig = require( '@wordpress/scripts/config/playwright.config' );

module.exports = defineConfig( {
	...baseConfig,
	testDir: path.join( __dirname, 'tests/e2e' ),
	webServer: {
		...baseConfig.webServer,
		command: 'npx wp-env start',
	},
} );
