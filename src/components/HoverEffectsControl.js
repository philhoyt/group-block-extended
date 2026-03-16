import { __ } from '@wordpress/i18n';
import { RangeControl } from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

export default function HoverEffectsControl( { attributes, setAttributes } ) {
	const {
		hoverTextColor,
		hoverBackgroundColor,
		hoverLinkColor,
		hoverOverlayColor,
		hoverOverlayOpacity,
	} = attributes;

	const hasAny = !! ( hoverTextColor || hoverBackgroundColor || hoverLinkColor );
	const hasOverlay = !! hoverOverlayColor;

	return (
		<>
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
							setAttributes( {
								hoverBackgroundColor: value ?? '',
							} ),
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
			<PanelColorSettings
				title={ __( 'Hover Overlay', 'group-block-extended' ) }
				initialOpen={ hasOverlay }
				colorSettings={ [
					{
						value: hoverOverlayColor,
						onChange: ( value ) => {
							const update = { hoverOverlayColor: value ?? '' };
							if ( ! value ) {
								update.hoverOverlayOpacity = 50;
							}
							setAttributes( update );
						},
						label: __( 'Color', 'group-block-extended' ),
					},
				] }
			>
				{ hasOverlay && (
					<RangeControl
						label={ __( 'Opacity', 'group-block-extended' ) }
						value={ hoverOverlayOpacity ?? 50 }
						onChange={ ( value ) =>
							setAttributes( { hoverOverlayOpacity: value } )
						}
						min={ 0 }
						max={ 100 }
						step={ 10 }
					/>
				) }
			</PanelColorSettings>
		</>
	);
}
