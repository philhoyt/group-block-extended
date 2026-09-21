import { cloneElement, createElement } from '@wordpress/element';

/**
 * Pure helpers used by the blocks.getSaveElement filter. Kept free of
 * block-editor imports so they can be unit tested.
 */

export function hasAnyHoverEffect( attributes ) {
	return !! (
		attributes.hoverTextColor ||
		attributes.hoverBackgroundColor ||
		attributes.hoverLinkColor
	);
}

export function hasOverlay( attributes ) {
	return !! attributes.overlayColor;
}

/**
 * Convert "16:9" → "16/9" for CSS aspect-ratio.
 *
 * @param {string} ratio
 * @return {string} CSS value, or '' when the input is not a ratio.
 */
export function ratioCss( ratio ) {
	const match = String( ratio )
		.trim()
		.match( /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/ );
	return match ? `${ match[ 1 ] }/${ match[ 2 ] }` : '';
}

/**
 * Clone a React element, merging an additional CSS declaration into its style prop.
 *
 * @param {import('react').ReactElement} element
 * @param {string}                       cssDeclaration
 * @return {import('react').ReactElement} The cloned element.
 */
export function injectStyleProp( element, cssDeclaration ) {
	if ( ! element || typeof element !== 'object' ) {
		return element;
	}

	const existingStyle = element.props?.style ?? {};

	// If style is a string (shouldn't be in React, but guard anyway).
	if ( typeof existingStyle === 'string' ) {
		return cloneElement( element, {
			style:
				existingStyle +
				( existingStyle.endsWith( ';' ) ? ' ' : '; ' ) +
				cssDeclaration,
		} );
	}

	// Parse the declaration "aspect-ratio: 16/9;" into { aspectRatio: '16/9' }.
	const [ prop, value ] = cssDeclaration
		.replace( /;$/, '' )
		.split( ':' )
		.map( ( s ) => s.trim() );
	const camelProp = prop.replace( /-([a-z])/g, ( _, l ) => l.toUpperCase() );

	return cloneElement( element, {
		style: { ...existingStyle, [ camelProp ]: value },
	} );
}

/**
 * Apply aspect ratio, hover colors, overlay, and the static link wrapper to a
 * core/group save element.
 *
 * @param {import('react').ReactElement} element    The block's save element.
 * @param {Object}                       attributes Block attributes.
 * @return {import('react').ReactElement} The modified element.
 */
export function modifyGroupSaveElement( element, attributes ) {
	const {
		groupAspectRatio,
		groupLinkUrl,
		groupLinkNewTab,
		groupLinkRel,
		groupLinkAriaLabel,
		groupLinkTitle,
		groupLinkToPost,
		hoverTextColor,
		hoverBackgroundColor,
		hoverLinkColor,
		overlayColor,
		overlayOpacity,
		overlayHoverColor,
		overlayHoverOpacity,
	} = attributes;

	// Nothing to do.
	if (
		! groupAspectRatio &&
		! groupLinkUrl &&
		! hasAnyHoverEffect( attributes ) &&
		! hasOverlay( attributes )
	) {
		return element;
	}

	let modifiedElement = element;

	// ── Aspect Ratio ──────────────────────────────────────────────────────
	if ( groupAspectRatio ) {
		const cssValue = ratioCss( groupAspectRatio );
		if ( cssValue ) {
			modifiedElement = injectStyleProp(
				modifiedElement,
				`aspect-ratio: ${ cssValue };`
			);
		}
	}

	// ── Hover Colors ──────────────────────────────────────────────────────────
	if ( hasAnyHoverEffect( attributes ) ) {
		const hoverStyle = {};
		if ( hoverTextColor ) {
			hoverStyle[ '--hover-text-color' ] = hoverTextColor;
		}
		if ( hoverBackgroundColor ) {
			hoverStyle[ '--hover-background-color' ] = hoverBackgroundColor;
		}
		if ( hoverLinkColor ) {
			hoverStyle[ '--hover-link-color' ] = hoverLinkColor;
		}

		modifiedElement = cloneElement( modifiedElement, {
			className: [
				modifiedElement.props?.className,
				'has-hover-colors',
				hoverBackgroundColor ? 'has-hover-bg-color' : '',
			]
				.filter( Boolean )
				.join( ' ' ),
			style: {
				...modifiedElement.props?.style,
				...hoverStyle,
			},
		} );
	}

	// ── Overlay (default + hover state) ──────────────────────────────────────
	if ( hasOverlay( attributes ) ) {
		const overlayStyle = {
			'--overlay-color': overlayColor,
			'--overlay-opacity': overlayOpacity ?? 50,
			'--overlay-hover-opacity': overlayHoverOpacity ?? 50,
		};
		if ( overlayHoverColor ) {
			overlayStyle[ '--overlay-hover-color' ] = overlayHoverColor;
		}

		modifiedElement = cloneElement( modifiedElement, {
			className: [ modifiedElement.props?.className, 'has-overlay' ]
				.filter( Boolean )
				.join( ' ' ),
			style: {
				...modifiedElement.props?.style,
				...overlayStyle,
			},
		} );
	}

	// ── Static Link Wrap ──────────────────────────────────────────────────
	// groupLinkToPost is handled PHP-side only; never write permalink into saved HTML.
	if ( groupLinkUrl && ! groupLinkToPost ) {
		const relParts = ( groupLinkRel || '' ).split( ' ' ).filter( Boolean );
		if ( groupLinkNewTab ) {
			if ( ! relParts.includes( 'noopener' ) ) {
				relParts.push( 'noopener' );
			}
			if ( ! relParts.includes( 'noreferrer' ) ) {
				relParts.push( 'noreferrer' );
			}
		}

		const linkProps = {
			href: groupLinkUrl,
			className: 'wp-block-group-link',
		};

		if ( groupLinkNewTab ) {
			linkProps.target = '_blank';
		}
		if ( relParts.length ) {
			linkProps.rel = relParts.join( ' ' );
		}
		if ( groupLinkAriaLabel ) {
			linkProps[ 'aria-label' ] = groupLinkAriaLabel;
		}
		if ( groupLinkTitle ) {
			linkProps.title = groupLinkTitle;
		}

		modifiedElement = createElement( 'a', linkProps, modifiedElement );
	}

	return modifiedElement;
}
