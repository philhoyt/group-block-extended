import { sanitizeLinkUrl, sanitizeRel } from '../utils/link';

describe( 'sanitizeLinkUrl', () => {
	it.each( [
		'https://example.com/path?x=1#y',
		'http://example.com',
		'mailto:hi@example.com',
		'tel:+15555555555',
		'/relative/path',
		'#anchor',
		'?query=1',
		'example.com/foo:bar',
	] )( 'allows %s', ( url ) => {
		expect( sanitizeLinkUrl( url ) ).toBe( url );
	} );

	it.each( [
		'javascript:alert(1)',
		'JavaScript:alert(1)',
		'data:text/html,hi',
		'vbscript:msgbox',
	] )( 'rejects %s', ( url ) => {
		expect( sanitizeLinkUrl( url ) ).toBe( '' );
	} );

	it( 'returns an empty string for empty input', () => {
		expect( sanitizeLinkUrl( undefined ) ).toBe( '' );
		expect( sanitizeLinkUrl( '' ) ).toBe( '' );
	} );
} );

describe( 'sanitizeRel', () => {
	it( 'keeps valid tokens separated by single spaces', () => {
		expect( sanitizeRel( '  nofollow   sponsored ' ) ).toBe(
			'nofollow sponsored'
		);
	} );

	it( 'strips characters that are not valid in a link type', () => {
		expect( sanitizeRel( 'no"follow x=y' ) ).toBe( 'nofollow xy' );
	} );

	it( 'returns an empty string for empty input', () => {
		expect( sanitizeRel( undefined ) ).toBe( '' );
	} );
} );
