import { addFilter } from '@wordpress/hooks';
import { InspectorControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { cloneElement, createElement } from '@wordpress/element';

import AspectRatioControl from './components/AspectRatioControl';
import LinkedGroupControl from './components/LinkedGroupControl';
import LinkedGroupToolbar from './components/LinkedGroupToolbar';

import './editor.scss';

// ── editor.BlockEdit filter ───────────────────────────────────────────────────
// Injects inspector panels into the Group block sidebar.

addFilter(
	'editor.BlockEdit',
	'group-block-extended/with-inspector-controls',
	createHigherOrderComponent(
		( BlockEdit ) => {
			return function GroupBlockExtended( props ) {
				if ( props.name !== 'core/group' ) {
					return <BlockEdit { ...props } />;
				}

				const { clientId, attributes, setAttributes, context } = props;

				return (
					<>
						<BlockEdit { ...props } />
						<LinkedGroupToolbar
							attributes={ attributes }
							setAttributes={ setAttributes }
						/>
						<InspectorControls>
							<AspectRatioControl
								clientId={ clientId }
								attributes={ attributes }
								setAttributes={ setAttributes }
							/>
							<LinkedGroupControl
								clientId={ clientId }
								attributes={ attributes }
								setAttributes={ setAttributes }
								context={ context }
							/>
						</InspectorControls>
					</>
				);
			};
		},
		'withGroupBlockExtendedControls'
	)
);

// ── editor.BlockListBlock filter ──────────────────────────────────────────────
// Applies aspect-ratio style directly on the canvas block wrapper so it's
// visible while editing, without touching saved HTML.

addFilter(
	'editor.BlockListBlock',
	'group-block-extended/aspect-ratio-editor',
	createHigherOrderComponent(
		( BlockListBlock ) => ( props ) => {
			if ( props.name !== 'core/group' ) {
				return <BlockListBlock { ...props } />;
			}

			const { groupAspectRatio } = props.attributes;
			const cssValue = groupAspectRatio ? ratioCss( groupAspectRatio ) : '';

			if ( ! cssValue ) {
				return <BlockListBlock { ...props } />;
			}

			const wrapperProps = {
				...props.wrapperProps,
				style: {
					...props.wrapperProps?.style,
					aspectRatio: cssValue,
				},
			};

			return <BlockListBlock { ...props } wrapperProps={ wrapperProps } />;
		},
		'withGroupBlockAspectRatioEditor'
	)
);

// ── blocks.getSaveElement filter ──────────────────────────────────────────────
// Modifies saved HTML to add aspect-ratio style and wrap with <a> for static links.

addFilter(
	'blocks.getSaveElement',
	'group-block-extended/save-element',
	( element, blockType, attributes ) => {
		if ( blockType.name !== 'core/group' ) {
			return element;
		}

		const {
			groupAspectRatio,
			groupLinkUrl,
			groupLinkNewTab,
			groupLinkRel,
			groupLinkAriaLabel,
			groupLinkTitle,
			groupLinkToPost,
		} = attributes;

		// Nothing to do.
		if ( ! groupAspectRatio && ! groupLinkUrl ) {
			return element;
		}

		let modifiedElement = element;

		// ── Aspect Ratio ──────────────────────────────────────────────────────
		if ( groupAspectRatio ) {
			const cssValue = ratioCss( groupAspectRatio );
			if ( cssValue ) {
				// Inject aspect-ratio into the wrapper element's style prop.
				modifiedElement = injectStyleProp( modifiedElement, `aspect-ratio: ${ cssValue };` );
			}
		}

		// ── Static Link Wrap ──────────────────────────────────────────────────
		// groupLinkToPost is handled PHP-side only; never write permalink into saved HTML.
		if ( groupLinkUrl && ! groupLinkToPost ) {
			const relParts = ( groupLinkRel || '' ).split( ' ' ).filter( Boolean );
			if ( groupLinkNewTab ) {
				if ( ! relParts.includes( 'noopener' ) )   relParts.push( 'noopener' );
				if ( ! relParts.includes( 'noreferrer' ) ) relParts.push( 'noreferrer' );
			}

			const linkProps = {
				href:       groupLinkUrl,
				className:  'wp-block-group-link',
			};

			if ( groupLinkNewTab )        linkProps.target    = '_blank';
			if ( relParts.length )        linkProps.rel       = relParts.join( ' ' );
			if ( groupLinkAriaLabel )     linkProps[ 'aria-label' ] = groupLinkAriaLabel;
			if ( groupLinkTitle )         linkProps.title     = groupLinkTitle;

			modifiedElement = createElement( 'a', linkProps, modifiedElement );
		}

		return modifiedElement;
	}
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert "16:9" → "16/9" for CSS aspect-ratio.
 */
function ratioCss( ratio ) {
	const match = String( ratio ).trim().match( /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/ );
	return match ? `${ match[ 1 ] }/${ match[ 2 ] }` : '';
}

/**
 * Clone a React element, merging an additional CSS declaration into its style prop.
 */
function injectStyleProp( element, cssDeclaration ) {
	if ( ! element || typeof element !== 'object' ) return element;

	const existingStyle = element.props?.style ?? {};

	// If style is a string (shouldn't be in React, but guard anyway).
	if ( typeof existingStyle === 'string' ) {
		return cloneElement( element, {
			style: existingStyle + ( existingStyle.endsWith( ';' ) ? ' ' : '; ' ) + cssDeclaration,
		} );
	}

	// Parse the declaration "aspect-ratio: 16/9;" into { aspectRatio: '16/9' }.
	const [ prop, value ] = cssDeclaration.replace( /;$/, '' ).split( ':' ).map( ( s ) => s.trim() );
	const camelProp = prop.replace( /-([a-z])/g, ( _, l ) => l.toUpperCase() );

	return cloneElement( element, {
		style: { ...existingStyle, [ camelProp ]: value },
	} );
}
