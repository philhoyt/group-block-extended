/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Serialized content: two static linked groups and a spacer, so the editor
 * can be driven without the plugin's own controls.
 */
const LINKED_GROUPS = `<!-- wp:group {"groupLinkUrl":"https://example.com/one","hoverTextColor":"#ff0000","layout":{"type":"constrained"}} -->
<a href="https://example.com/one" class="wp-block-group-link"><div class="wp-block-group has-hover-colors" style="--hover-text-color:#ff0000"><!-- wp:paragraph -->
<p>Linked group one</p>
<!-- /wp:paragraph --></div></a>
<!-- /wp:group -->

<!-- wp:group {"groupLinkUrl":"https://example.com/two","layout":{"type":"constrained"}} -->
<a href="https://example.com/two" class="wp-block-group-link"><div class="wp-block-group"><!-- wp:paragraph -->
<p>Linked group two</p>
<!-- /wp:paragraph --></div></a>
<!-- /wp:group -->

<!-- wp:spacer {"height":"40px"} -->
<div style="height:40px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->`;

test.describe( 'Group Block Extended', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'loads without deprecation warnings or console errors', async ( {
		editor,
		page,
	} ) => {
		const messages = [];
		page.on( 'console', ( msg ) => {
			if ( [ 'error', 'warning' ].includes( msg.type() ) ) {
				messages.push( msg.text() );
			}
		} );

		await editor.setContent( LINKED_GROUPS );
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/group"]' ).first()
		);
		await editor.openDocumentSettingsSidebar();
		await expect(
			page.getByRole( 'button', { name: 'Linked Group' } )
		).toBeVisible();

		expect(
			messages.filter( ( m ) =>
				m.includes( '__experimentalLinkControl' )
			)
		).toEqual( [] );
	} );

	test( 'shows the linked badge on linked groups in the canvas', async ( {
		editor,
	} ) => {
		await editor.setContent( LINKED_GROUPS );

		const linked = editor.canvas.locator(
			'[data-type="core/group"].is-group-linked'
		);
		await expect( linked ).toHaveCount( 2 );
		await expect( linked.first() ).toHaveAttribute(
			'data-gbe-linked-label',
			'Linked'
		);
	} );

	test( 'Cmd/Ctrl+Shift+K with a non-group block selected does not remove links from other groups', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.setContent( LINKED_GROUPS );

		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/spacer"]' )
		);
		await pageUtils.pressKeys( 'primaryShift+k' );

		const blocks = await editor.getBlocks();
		const groups = blocks.filter( ( b ) => b.name === 'core/group' );
		expect( groups.map( ( b ) => b.attributes.groupLinkUrl ) ).toEqual( [
			'https://example.com/one',
			'https://example.com/two',
		] );

		// The same shortcut with a linked group selected removes only that link.
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/group"]' ).first()
		);
		await pageUtils.pressKeys( 'primaryShift+k' );

		const after = ( await editor.getBlocks() ).filter(
			( b ) => b.name === 'core/group'
		);
		expect( after.map( ( b ) => b.attributes.groupLinkUrl ) ).toEqual( [
			'',
			'https://example.com/two',
		] );
		await expect( page.locator( 'body' ) ).toBeVisible();
	} );

	test( 'Custom… aspect ratio reveals the text field and stores the value', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { layout: { type: 'constrained' } },
			innerBlocks: [
				{ name: 'core/paragraph', attributes: { content: 'Hi' } },
			],
		} );
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/group"]' )
		);
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'tab', { name: 'Styles' } ).click();

		// The panel starts collapsed when no ratio is set.
		await page.getByRole( 'button', { name: 'Aspect Ratio' } ).click();

		const select = page.getByRole( 'combobox', { name: 'Ratio' } );
		await select.selectOption( '16:9' );
		await select.selectOption( 'custom' );

		const custom = page.getByRole( 'textbox', { name: 'Custom ratio' } );
		await expect( custom ).toBeVisible();
		await expect( select ).toHaveValue( 'custom' );

		await custom.fill( '7:3' );

		const [ group ] = await editor.getBlocks();
		expect( group.attributes.groupAspectRatio ).toBe( '7:3' );
		await expect( select ).toHaveValue( 'custom' );
	} );
} );
