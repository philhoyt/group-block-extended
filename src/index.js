import { addFilter } from '@wordpress/hooks';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { cloneElement, createElement } from '@wordpress/element';
import { ToolbarDropdownMenu } from '@wordpress/components';
import { justifyLeft, justifyCenter, justifyRight, justifySpaceBetween } from '@wordpress/icons';
import {
	getBlockVariations,
	unregisterBlockVariation,
	registerBlockVariation,
} from '@wordpress/blocks';
import domReady from '@wordpress/dom-ready';

import AspectRatioControl from './components/AspectRatioControl';
import LinkedGroupControl from './components/LinkedGroupControl';
import LinkedGroupToolbar from './components/LinkedGroupToolbar';
import HoverEffectsControl from './components/HoverEffectsControl';

import './editor.scss';

// ── Default Overrides for the "Group" Variation ──────────────────────────────
// Replaces the built-in "group" variation so that picking "Group" from the
// variation picker creates a block with admin-configured defaults (alignment
// and/or layout). Row, Stack, and Grid variations are left untouched.

const pluginSettings = window.groupBlockExtended ?? {};

domReady( () => {
	const { defaultAlignment, disableContentWidth } = pluginSettings;

	if ( ! defaultAlignment && ! disableContentWidth ) {
		return;
	}

	const variations = getBlockVariations( 'core/group' );
	const groupVariation = variations?.find( ( v ) => v.name === 'group' );

	if ( ! groupVariation ) {
		return;
	}

	// Build replacement attributes.
	const newAttributes = { ...groupVariation.attributes };

	if ( disableContentWidth ) {
		newAttributes.layout = { type: 'default' };
	}

	if ( defaultAlignment ) {
		newAttributes.align = defaultAlignment;
	}

	// Swap the variation.
	unregisterBlockVariation( 'core/group', 'group' );
	registerBlockVariation( 'core/group', {
		...groupVariation,
		attributes: newAttributes,
		isActive: ( blockAttributes ) =>
			! blockAttributes.layout?.type ||
			blockAttributes.layout?.type === 'constrained' ||
			blockAttributes.layout?.type === 'default',
	} );
} );

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasAnyHoverEffect( attributes ) {
	return !! (
		attributes.hoverTextColor ||
		attributes.hoverBackgroundColor ||
		attributes.hoverLinkColor
	);
}

function hasOverlay( attributes ) {
	return !! attributes.overlayColor;
}

// ── Justification toolbar — replaces core flex layout justify control ─────────
// blocks.registerBlockType filter suppresses the core control so we can render
// our own dropdown that includes the extra "space around" option.

addFilter(
	'blocks.registerBlockType',
	'group-block-extended/modify-supports',
	( settings, name ) => {
		if ( name !== 'core/group' && name !== 'core/navigation' ) {
			return settings;
		}

		const newSupports = {
			...settings.supports,
			// Suppress the core justify dropdown so our unified replacement renders.
			layout: {
				...settings.supports?.layout,
				allowJustification: false,
			},
		};

		// Enable height control — core only ships minHeight for group.
		if ( name === 'core/group' ) {
			newSupports.dimensions = {
				...settings.supports?.dimensions,
				height: true,
			};
		}

		return { ...settings, supports: newSupports };
	}
);

const spaceAroundIcon = (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
		<path d="M4 4h1v16H4zm15 0h1v16h-1zM7 8h3v8H7V8zm7 0h3v8h-3V8z" />
	</svg>
);

const JUSTIFY_OPTIONS = [
	{ title: 'Justify items left', icon: justifyLeft, value: 'left' },
	{ title: 'Justify items center', icon: justifyCenter, value: 'center' },
	{ title: 'Justify items right', icon: justifyRight, value: 'right' },
	{ title: 'Space between items', icon: justifySpaceBetween, value: 'space-between' },
	{ title: 'Space around items', icon: spaceAroundIcon, value: 'space-around' },
];

// ── editor.BlockEdit filter ───────────────────────────────────────────────────
// Injects inspector panels into the Group block sidebar.

addFilter(
	'editor.BlockEdit',
	'group-block-extended/with-inspector-controls',
	createHigherOrderComponent( ( BlockEdit ) => {
		return function GroupBlockExtended( props ) {
			const isGroup = props.name === 'core/group';
			const isNav = props.name === 'core/navigation';

			if ( ! isGroup && ! isNav ) {
				return <BlockEdit { ...props } />;
			}

			const { clientId, attributes, setAttributes, context } = props;
			const layout = attributes.layout ?? {};
			// Navigation is always flex; group must opt in via layout.type.
			const isFlexLayout = isNav || layout.type === 'flex';

			return (
				<>
					<BlockEdit { ...props } />
					{ isFlexLayout && (
						<BlockControls group="block">
							<ToolbarDropdownMenu
								icon={
									JUSTIFY_OPTIONS.find(
										( o ) =>
											o.value ===
											layout.justifyContent
									)?.icon ?? justifyLeft
								}
								label="Change items justification"
								controls={ JUSTIFY_OPTIONS.map( ( option ) => ( {
									title: option.title,
									icon: option.icon,
									isActive:
										layout.justifyContent === option.value,
									onClick: () =>
										setAttributes( {
											layout: {
												...layout,
												justifyContent:
													layout.justifyContent ===
													option.value
														? undefined
														: option.value,
											},
										} ),
								} ) ) }
							/>
						</BlockControls>
					) }
					{ isGroup && (
						<>
							<LinkedGroupToolbar
								attributes={ attributes }
								setAttributes={ setAttributes }
							/>
							<InspectorControls group="styles">
								<AspectRatioControl
									clientId={ clientId }
									attributes={ attributes }
									setAttributes={ setAttributes }
								/>
								<HoverEffectsControl
									attributes={ attributes }
									setAttributes={ setAttributes }
								/>
							</InspectorControls>
							<InspectorControls>
								<LinkedGroupControl
									clientId={ clientId }
									attributes={ attributes }
									setAttributes={ setAttributes }
									context={ context }
								/>
							</InspectorControls>
						</>
					) }
				</>
			);
		};
	}, 'withGroupBlockExtendedControls' )
);

// ── editor.BlockListBlock filter ──────────────────────────────────────────────
// Applies aspect-ratio style directly on the canvas block wrapper so it's
// visible while editing, without touching saved HTML.

addFilter(
	'editor.BlockListBlock',
	'group-block-extended/block-list-block',
	createHigherOrderComponent(
		( BlockListBlock ) => ( props ) => {
			// ── Navigation: add class + inline CSS variable ───────────────────
			// The class drives frontend-parity CSS; the inline custom property
			// overrides the navigation block's own --navigation-layout-justify
			// default in the editor canvas regardless of CSS load order.
			if ( props.name === 'core/navigation' ) {
				const navLayout = props.attributes.layout ?? {};
				if ( navLayout.justifyContent !== 'space-around' ) {
					return <BlockListBlock { ...props } />;
				}
				const existingClassName =
					props.wrapperProps?.className ?? '';
				const wrapperProps = {
					...props.wrapperProps,
					className: [
						existingClassName,
						'items-justified-space-around',
					]
						.filter( Boolean )
						.join( ' ' ),
					style: {
						...props.wrapperProps?.style,
						'--navigation-layout-justify': 'space-around',
					},
				};
				return (
					<BlockListBlock { ...props } wrapperProps={ wrapperProps } />
				);
			}

			if ( props.name !== 'core/group' ) {
				return <BlockListBlock { ...props } />;
			}

			const {
				groupAspectRatio,
				hoverTextColor,
				hoverBackgroundColor,
				hoverLinkColor,
				overlayColor,
				overlayOpacity,
				overlayHoverColor,
				overlayHoverOpacity,
				layout: blockLayout,
			} = props.attributes;
			const cssValue = groupAspectRatio
				? ratioCss( groupAspectRatio )
				: '';
			const hasHover = hasAnyHoverEffect( props.attributes );
			const hasOv = hasOverlay( props.attributes );
			const isSpaceAround =
				blockLayout?.type === 'flex' &&
				blockLayout?.justifyContent === 'space-around';

			if ( ! cssValue && ! hasHover && ! hasOv && ! isSpaceAround ) {
				return <BlockListBlock { ...props } />;
			}

			const extraStyle = {};
			if ( hoverTextColor ) {
				extraStyle[ '--hover-text-color' ] = hoverTextColor;
			}
			if ( hoverBackgroundColor ) {
				extraStyle[ '--hover-background-color' ] = hoverBackgroundColor;
			}
			if ( hoverLinkColor ) {
				extraStyle[ '--hover-link-color' ] = hoverLinkColor;
			}
			if ( overlayColor ) {
				extraStyle[ '--overlay-color' ] = overlayColor;
				extraStyle[ '--overlay-opacity' ] = overlayOpacity ?? 50;
				extraStyle[ '--overlay-hover-opacity' ] =
					overlayHoverOpacity ?? 50;
				if ( overlayHoverColor ) {
					extraStyle[ '--overlay-hover-color' ] = overlayHoverColor;
				}
			}

			const existingClassName = props.wrapperProps?.className ?? '';
			const wrapperProps = {
				...props.wrapperProps,
				style: {
					...props.wrapperProps?.style,
					...( cssValue && { aspectRatio: cssValue } ),
					...extraStyle,
				},
				className: [
					existingClassName,
					hasHover ? 'has-hover-colors' : '',
					hasOv ? 'has-overlay' : '',
					isSpaceAround ? 'gbe-justify-space-around' : '',
				]
					.filter( Boolean )
					.join( ' ' ),
			};

			return (
				<BlockListBlock { ...props } wrapperProps={ wrapperProps } />
			);
		},
		'withGroupBlockExtendedEditorWrapper'
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
				// Inject aspect-ratio into the wrapper element's style prop.
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
			const relParts = ( groupLinkRel || '' )
				.split( ' ' )
				.filter( Boolean );
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
);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Convert "16:9" → "16/9" for CSS aspect-ratio.
 * @param {string} ratio
 */
function ratioCss( ratio ) {
	const match = String( ratio )
		.trim()
		.match( /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/ );
	return match ? `${ match[ 1 ] }/${ match[ 2 ] }` : '';
}

/**
 * Clone a React element, merging an additional CSS declaration into its style prop.
 * @param {import('react').ReactElement} element
 * @param {string}                       cssDeclaration
 */
function injectStyleProp( element, cssDeclaration ) {
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
