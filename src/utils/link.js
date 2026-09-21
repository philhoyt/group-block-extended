import { getProtocol, isValidProtocol } from '@wordpress/url';

const ALLOWED_PROTOCOLS = [ 'http:', 'https:', 'mailto:', 'tel:', 'sms:' ];

/**
 * Reject URLs that carry a protocol outside the allowlist (javascript:, data:, …).
 * Relative URLs and anchors have no protocol and pass through unchanged.
 *
 * @param {string} url
 * @return {string} The URL, or '' when its protocol is not allowed.
 */
export function sanitizeLinkUrl( url ) {
	if ( ! url ) {
		return '';
	}

	const protocol = getProtocol( url );

	// No protocol, or something that only looks like one (e.g. "foo/bar:baz"):
	// treat as a relative path.
	if ( ! protocol || ! isValidProtocol( protocol ) ) {
		return url;
	}

	return ALLOWED_PROTOCOLS.includes( protocol.toLowerCase() ) ? url : '';
}

/**
 * Keep only valid rel link-type tokens (letters, digits, hyphens) separated by
 * single spaces.
 *
 * @param {string} rel
 * @return {string} Space-separated valid tokens.
 */
export function sanitizeRel( rel ) {
	return ( rel || '' )
		.split( /\s+/ )
		.map( ( token ) => token.replace( /[^a-z0-9-]/gi, '' ) )
		.filter( Boolean )
		.join( ' ' );
}
