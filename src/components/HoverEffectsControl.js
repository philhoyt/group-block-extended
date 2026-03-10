import { __ } from '@wordpress/i18n';
import { PanelBody, SelectControl, TextControl } from '@wordpress/components';

const TRANSFORM_PRESETS = [
	{ label: __( 'None', 'group-block-extended' ),         value: '' },
	{ label: __( 'Rise', 'group-block-extended' ),         value: 'translateY(-4px)' },
	{ label: __( 'Sink', 'group-block-extended' ),         value: 'translateY(4px)' },
	{ label: __( 'Scale up', 'group-block-extended' ),     value: 'scale(1.03)' },
	{ label: __( 'Scale down', 'group-block-extended' ),   value: 'scale(0.97)' },
	{ label: __( 'Shift right', 'group-block-extended' ),  value: 'translateX(4px)' },
	{ label: __( 'Shift left', 'group-block-extended' ),   value: 'translateX(-4px)' },
	{ label: __( 'Custom…', 'group-block-extended' ),      value: 'custom' },
];

const SHADOW_PRESETS = [
	{ label: __( 'None', 'group-block-extended' ),   value: '' },
	{ label: __( 'Small', 'group-block-extended' ),  value: '0 2px 8px rgba(0,0,0,0.12)' },
	{ label: __( 'Medium', 'group-block-extended' ), value: '0 4px 16px rgba(0,0,0,0.16)' },
	{ label: __( 'Large', 'group-block-extended' ),  value: '0 8px 32px rgba(0,0,0,0.20)' },
	{ label: __( 'Lifted', 'group-block-extended' ), value: '0 12px 40px rgba(0,0,0,0.24)' },
	{ label: __( 'Custom…', 'group-block-extended' ), value: 'custom' },
];

const OPACITY_PRESETS = [
	{ label: __( 'None', 'group-block-extended' ),   value: '' },
	{ label: __( '90%', 'group-block-extended' ),    value: '0.9' },
	{ label: __( '80%', 'group-block-extended' ),    value: '0.8' },
	{ label: __( '70%', 'group-block-extended' ),    value: '0.7' },
	{ label: __( 'Custom…', 'group-block-extended' ), value: 'custom' },
];

const FILTER_PRESETS = [
	{ label: __( 'None', 'group-block-extended' ),        value: '' },
	{ label: __( 'Brighten', 'group-block-extended' ),    value: 'brightness(1.1)' },
	{ label: __( 'Darken', 'group-block-extended' ),      value: 'brightness(0.9)' },
	{ label: __( 'Saturate', 'group-block-extended' ),    value: 'saturate(1.3)' },
	{ label: __( 'Desaturate', 'group-block-extended' ),  value: 'saturate(0.7)' },
	{ label: __( 'Blur', 'group-block-extended' ),        value: 'blur(2px)' },
	{ label: __( 'Custom…', 'group-block-extended' ),     value: 'custom' },
];

const DURATION_PRESETS = [
	{ label: __( 'Default (300ms)', 'group-block-extended' ), value: '' },
	{ label: __( 'Fast (150ms)', 'group-block-extended' ),    value: '150ms' },
	{ label: __( 'Slow (500ms)', 'group-block-extended' ),    value: '500ms' },
	{ label: __( 'Very slow (800ms)', 'group-block-extended' ), value: '800ms' },
	{ label: __( 'Custom…', 'group-block-extended' ),         value: 'custom' },
];

const EASING_PRESETS = [
	{ label: __( 'Default (ease)', 'group-block-extended' ),   value: '' },
	{ label: __( 'Linear', 'group-block-extended' ),           value: 'linear' },
	{ label: __( 'Ease in', 'group-block-extended' ),          value: 'ease-in' },
	{ label: __( 'Ease out', 'group-block-extended' ),         value: 'ease-out' },
	{ label: __( 'Ease in-out', 'group-block-extended' ),      value: 'ease-in-out' },
	{ label: __( 'Spring', 'group-block-extended' ),           value: 'cubic-bezier(0.34,1.56,0.64,1)' },
	{ label: __( 'Custom…', 'group-block-extended' ),          value: 'custom' },
];

/**
 * Given a stored attribute value and a preset list, return the SelectControl value.
 * Returns '' (None), a preset value, or 'custom'.
 */
function getSelectValue( storedValue, presets ) {
	if ( ! storedValue ) return '';
	const presetValues = presets
		.map( ( p ) => p.value )
		.filter( ( v ) => v !== '' && v !== 'custom' );
	return presetValues.includes( storedValue ) ? storedValue : 'custom';
}

export default function HoverEffectsControl( { attributes, setAttributes } ) {
	const {
		hoverTransform,
		hoverShadow,
		hoverOpacity,
		hoverFilter,
		hoverDuration,
		hoverEasing,
	} = attributes;

	const hasAny = !! ( hoverTransform || hoverShadow || hoverOpacity || hoverFilter || hoverDuration || hoverEasing );

	function makeSelectHandler( attrKey, presets ) {
		return ( value ) => {
			if ( value === 'custom' ) {
				// If already custom, keep the current value; otherwise clear to let user type.
				const currentSelect = getSelectValue( attributes[ attrKey ], presets );
				setAttributes( { [ attrKey ]: currentSelect === 'custom' ? attributes[ attrKey ] : '' } );
			} else {
				setAttributes( { [ attrKey ]: value } );
			}
		};
	}

	return (
		<PanelBody
			title={ __( 'Hover Effects', 'group-block-extended' ) }
			initialOpen={ hasAny }
		>
			<SelectControl
				label={ __( 'Transform', 'group-block-extended' ) }
				value={ getSelectValue( hoverTransform, TRANSFORM_PRESETS ) }
				options={ TRANSFORM_PRESETS }
				onChange={ makeSelectHandler( 'hoverTransform', TRANSFORM_PRESETS ) }
			/>
			{ getSelectValue( hoverTransform, TRANSFORM_PRESETS ) === 'custom' && (
				<TextControl
					label={ __( 'Custom transform', 'group-block-extended' ) }
					value={ hoverTransform }
					placeholder="e.g. rotate(5deg)"
					onChange={ ( v ) => setAttributes( { hoverTransform: v } ) }
				/>
			) }

			<SelectControl
				label={ __( 'Shadow', 'group-block-extended' ) }
				value={ getSelectValue( hoverShadow, SHADOW_PRESETS ) }
				options={ SHADOW_PRESETS }
				onChange={ makeSelectHandler( 'hoverShadow', SHADOW_PRESETS ) }
			/>
			{ getSelectValue( hoverShadow, SHADOW_PRESETS ) === 'custom' && (
				<TextControl
					label={ __( 'Custom shadow', 'group-block-extended' ) }
					value={ hoverShadow }
					placeholder="e.g. 0 2px 4px rgba(0,0,0,0.2)"
					onChange={ ( v ) => setAttributes( { hoverShadow: v } ) }
				/>
			) }

			<SelectControl
				label={ __( 'Opacity', 'group-block-extended' ) }
				value={ getSelectValue( hoverOpacity, OPACITY_PRESETS ) }
				options={ OPACITY_PRESETS }
				onChange={ makeSelectHandler( 'hoverOpacity', OPACITY_PRESETS ) }
			/>
			{ getSelectValue( hoverOpacity, OPACITY_PRESETS ) === 'custom' && (
				<TextControl
					label={ __( 'Custom opacity', 'group-block-extended' ) }
					value={ hoverOpacity }
					placeholder="e.g. 0.75"
					onChange={ ( v ) => setAttributes( { hoverOpacity: v } ) }
				/>
			) }

			<SelectControl
				label={ __( 'Filter', 'group-block-extended' ) }
				value={ getSelectValue( hoverFilter, FILTER_PRESETS ) }
				options={ FILTER_PRESETS }
				onChange={ makeSelectHandler( 'hoverFilter', FILTER_PRESETS ) }
			/>
			{ getSelectValue( hoverFilter, FILTER_PRESETS ) === 'custom' && (
				<TextControl
					label={ __( 'Custom filter', 'group-block-extended' ) }
					value={ hoverFilter }
					placeholder="e.g. contrast(1.2)"
					onChange={ ( v ) => setAttributes( { hoverFilter: v } ) }
				/>
			) }

			<SelectControl
				label={ __( 'Duration', 'group-block-extended' ) }
				value={ getSelectValue( hoverDuration, DURATION_PRESETS ) }
				options={ DURATION_PRESETS }
				onChange={ makeSelectHandler( 'hoverDuration', DURATION_PRESETS ) }
			/>
			{ getSelectValue( hoverDuration, DURATION_PRESETS ) === 'custom' && (
				<TextControl
					label={ __( 'Custom duration', 'group-block-extended' ) }
					value={ hoverDuration }
					placeholder="e.g. 250ms"
					onChange={ ( v ) => setAttributes( { hoverDuration: v } ) }
				/>
			) }

			<SelectControl
				label={ __( 'Easing', 'group-block-extended' ) }
				value={ getSelectValue( hoverEasing, EASING_PRESETS ) }
				options={ EASING_PRESETS }
				onChange={ makeSelectHandler( 'hoverEasing', EASING_PRESETS ) }
			/>
			{ getSelectValue( hoverEasing, EASING_PRESETS ) === 'custom' && (
				<TextControl
					label={ __( 'Custom easing', 'group-block-extended' ) }
					value={ hoverEasing }
					placeholder="e.g. cubic-bezier(0.4,0,0.2,1)"
					onChange={ ( v ) => setAttributes( { hoverEasing: v } ) }
				/>
			) }
		</PanelBody>
	);
}
