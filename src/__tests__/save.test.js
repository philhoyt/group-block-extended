import { createElement, renderToString } from '@wordpress/element';

import { modifyGroupSaveElement, ratioCss, injectStyleProp } from '../save';

const group = ( props = {} ) =>
	createElement(
		'div',
		{ className: 'wp-block-group', ...props },
		createElement( 'p', null, 'Hi' )
	);

const html = ( element ) => renderToString( element );

describe( 'ratioCss', () => {
	it.each( [
		[ '16:9', '16/9' ],
		[ '4/3', '4/3' ],
		[ ' 2.5 : 1 ', '2.5/1' ],
	] )( 'converts %s to %s', ( input, expected ) => {
		expect( ratioCss( input ) ).toBe( expected );
	} );

	it.each( [ '', 'abc', '16:', ':9', '16:9; color:red', '1e3:1' ] )(
		'rejects %s',
		( input ) => {
			expect( ratioCss( input ) ).toBe( '' );
		}
	);
} );

describe( 'injectStyleProp', () => {
	it( 'merges a declaration into an object style', () => {
		const el = injectStyleProp(
			group( { style: { color: 'red' } } ),
			'aspect-ratio: 16/9;'
		);
		expect( el.props.style ).toEqual( {
			color: 'red',
			aspectRatio: '16/9',
		} );
	} );

	it( 'returns non-elements untouched', () => {
		expect( injectStyleProp( null, 'aspect-ratio: 1/1;' ) ).toBeNull();
	} );
} );

describe( 'modifyGroupSaveElement', () => {
	it( 'returns the element unchanged when no plugin attributes are set', () => {
		const el = group();
		expect( modifyGroupSaveElement( el, {} ) ).toBe( el );
	} );

	it( 'adds aspect-ratio to the wrapper style', () => {
		const out = html(
			modifyGroupSaveElement( group(), { groupAspectRatio: '16:9' } )
		);
		expect( out ).toContain( 'style="aspect-ratio:16/9"' );
	} );

	it( 'ignores an invalid aspect ratio', () => {
		const el = group();
		const out = modifyGroupSaveElement( el, {
			groupAspectRatio: 'not-a-ratio',
		} );
		expect( out.props.style ).toBeUndefined();
	} );

	it( 'adds hover classes and custom properties', () => {
		const out = html(
			modifyGroupSaveElement( group(), {
				hoverTextColor: '#f00',
				hoverBackgroundColor: '#000',
			} )
		);
		expect( out ).toContain(
			'class="wp-block-group has-hover-colors has-hover-bg-color"'
		);
		expect( out ).toContain( '--hover-text-color:#f00' );
		expect( out ).toContain( '--hover-background-color:#000' );
		expect( out ).not.toContain( '--hover-link-color' );
	} );

	it( 'adds overlay class and defaults opacity to 50', () => {
		const out = html(
			modifyGroupSaveElement( group(), { overlayColor: '#000' } )
		);
		expect( out ).toContain( 'has-overlay' );
		expect( out ).toContain( '--overlay-color:#000' );
		expect( out ).toContain( '--overlay-opacity:50' );
		expect( out ).toContain( '--overlay-hover-opacity:50' );
		expect( out ).not.toContain( '--overlay-hover-color' );
	} );

	it( 'wraps the group in an anchor for a static link', () => {
		const out = html(
			modifyGroupSaveElement( group(), {
				groupLinkUrl: 'https://example.com',
				groupLinkAriaLabel: 'Read more',
				groupLinkTitle: 'Example',
			} )
		);
		expect( out ).toMatch(
			/^<a href="https:\/\/example.com" class="wp-block-group-link" aria-label="Read more" title="Example"><div class="wp-block-group">/
		);
		expect( out ).toMatch( /<\/div><\/a>$/ );
	} );

	it( 'adds noopener noreferrer once when opening in a new tab', () => {
		const out = html(
			modifyGroupSaveElement( group(), {
				groupLinkUrl: 'https://example.com',
				groupLinkNewTab: true,
				groupLinkRel: 'nofollow noopener',
			} )
		);
		expect( out ).toContain( 'target="_blank"' );
		expect( out ).toContain( 'rel="nofollow noopener noreferrer"' );
	} );

	it( 'never writes a permalink for link-to-post', () => {
		const out = html(
			modifyGroupSaveElement( group(), {
				groupLinkUrl: 'https://example.com',
				groupLinkToPost: true,
			} )
		);
		expect( out ).not.toContain( '<a' );
	} );

	it( 'places hover and overlay styles on the group, not the link wrapper', () => {
		const out = modifyGroupSaveElement( group(), {
			groupLinkUrl: 'https://example.com',
			hoverTextColor: '#f00',
			groupAspectRatio: '1:1',
		} );
		expect( out.type ).toBe( 'a' );
		expect( out.props.style ).toBeUndefined();
		expect( out.props.children.props.style ).toEqual( {
			aspectRatio: '1/1',
			'--hover-text-color': '#f00',
		} );
	} );
} );
