import { __ } from '@wordpress/i18n';
import { PanelColorSettings } from '@wordpress/block-editor';

export default function HoverEffectsControl( { attributes, setAttributes } ) {
	const { hoverTextColor, hoverBackgroundColor, hoverLinkColor } = attributes;
	const hasAny = !! (
		hoverTextColor ||
		hoverBackgroundColor ||
		hoverLinkColor
	);

	return (
		<PanelColorSettings
			title={ __( 'Hover Colors', 'group-block-extended' ) }
			initialOpen={ hasAny }
			colorSettings={ [
				{
					value: hoverTextColor,
					onChange: ( value ) =>
						setAttributes( { hoverTextColor: value ?? '' } ),
					label: __( 'Text', 'group-block-extended' ),
				},
				{
					value: hoverBackgroundColor,
					onChange: ( value ) =>
						setAttributes( { hoverBackgroundColor: value ?? '' } ),
					label: __( 'Background', 'group-block-extended' ),
				},
				{
					value: hoverLinkColor,
					onChange: ( value ) =>
						setAttributes( { hoverLinkColor: value ?? '' } ),
					label: __( 'Link', 'group-block-extended' ),
				},
			] }
		/>
	);
}
