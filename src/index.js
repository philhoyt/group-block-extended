import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { InspectorControls, BlockControls } from '@wordpress/block-editor';
import { createHigherOrderComponent } from '@wordpress/compose';
import { ToolbarDropdownMenu } from '@wordpress/components';
import {
	justifyLeft,
	justifyCenter,
	justifyRight,
	justifySpaceBetween,
} from '@wordpress/icons';
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
import {
	hasAnyHoverEffect,
	hasOverlay,
	modifyGroupSaveElement,
	ratioCss,
} from './save';

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
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
	>
		<path d="M4 4h1v16H4zm15 0h1v16h-1zM7 8h3v8H7V8zm7 0h3v8h-3V8z" />
	</svg>
);

const JUSTIFY_OPTIONS = [
	{
		title: __( 'Justify items left', 'group-block-extended' ),
		icon: justifyLeft,
		value: 'left',
	},
	{
		title: __( 'Justify items center', 'group-block-extended' ),
		icon: justifyCenter,
		value: 'center',
	},
	{
		title: __( 'Justify items right', 'group-block-extended' ),
		icon: justifyRight,
		value: 'right',
	},
	{
		title: __( 'Space between items', 'group-block-extended' ),
		icon: justifySpaceBetween,
		value: 'space-between',
	},
	{
		title: __( 'Space around items', 'group-block-extended' ),
		icon: spaceAroundIcon,
		value: 'space-around',
	},
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

			const { clientId, attributes, setAttributes, context, isSelected } =
				props;
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
											o.value === layout.justifyContent
									)?.icon ?? justifyLeft
								}
								label={ __(
									'Change items justification',
									'group-block-extended'
								) }
								controls={ JUSTIFY_OPTIONS.map(
									( option ) => ( {
										title: option.title,
										icon: option.icon,
										isActive:
											layout.justifyContent ===
											option.value,
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
									} )
								) }
							/>
						</BlockControls>
					) }
					{ isGroup && (
						<>
							{ /* Only the selected block mounts the toolbar: its keyboard
							     shortcuts bind to document and must not fire for every
							     Group in the post. */ }
							{ isSelected && (
								<LinkedGroupToolbar
									attributes={ attributes }
									setAttributes={ setAttributes }
								/>
							) }
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
				const existingClassName = props.wrapperProps?.className ?? '';
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
					<BlockListBlock
						{ ...props }
						wrapperProps={ wrapperProps }
					/>
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
				groupLinkUrl,
				groupLinkToPost,
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
			const isLinked = !! ( groupLinkUrl || groupLinkToPost );

			if (
				! cssValue &&
				! hasHover &&
				! hasOv &&
				! isSpaceAround &&
				! isLinked
			) {
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
					hoverBackgroundColor ? 'has-hover-bg-color' : '',
					hasOv ? 'has-overlay' : '',
					isSpaceAround ? 'gbe-justify-space-around' : '',
					isLinked ? 'is-group-linked' : '',
				]
					.filter( Boolean )
					.join( ' ' ),
				// Read by editor.scss for the "Linked" badge so the label is translatable.
				...( isLinked && {
					'data-gbe-linked-label': __(
						'Linked',
						'group-block-extended'
					),
				} ),
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

		return modifyGroupSaveElement( element, attributes );
	}
);
