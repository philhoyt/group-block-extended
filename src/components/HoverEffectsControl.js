import { __ } from '@wordpress/i18n';
import { RangeControl } from '@wordpress/components';
import { PanelColorSettings } from '@wordpress/block-editor';

export default function HoverEffectsControl( { attributes, setAttributes } ) {
	const {
		hoverTextColor,
		hoverBackgroundColor,
		hoverLinkColor,
		overlayColor,
		overlayOpacity,
		overlayHoverColor,
		overlayHoverOpacity,
	} = attributes;

	const hasAnyHoverColor = !! (
		hoverTextColor ||
		hoverBackgroundColor ||
		hoverLinkColor
	);
	const hasOverlay = !! overlayColor;

	return (
		<>
			<PanelColorSettings
				title={ __( 'Hover Colors', 'group-block-extended' ) }
				initialOpen={ hasAnyHoverColor }
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
				title={ __( 'Overlay', 'group-block-extended' ) }
				initialOpen={ hasOverlay }
				colorSettings={ [
					{
						value: overlayColor,
						onChange: ( value ) => {
							const update = { overlayColor: value ?? '' };
							if ( ! value ) {
								update.overlayOpacity = 50;
								update.overlayHoverColor = '';
								update.overlayHoverOpacity = 50;
							}
							setAttributes( update );
						},
						label: __( 'Default Color', 'group-block-extended' ),
					},
					{
						value: overlayHoverColor,
						onChange: ( value ) =>
							setAttributes( { overlayHoverColor: value ?? '' } ),
						label: __( 'Hover Color', 'group-block-extended' ),
					},
				] }
			>
				{ hasOverlay && (
					<>
						<RangeControl
							label={ __(
								'Default Opacity',
								'group-block-extended'
							) }
							value={ overlayOpacity ?? 50 }
							onChange={ ( value ) =>
								setAttributes( { overlayOpacity: value } )
							}
							min={ 0 }
							max={ 100 }
							step={ 10 }
						/>
						<RangeControl
							label={ __(
								'Hover Opacity',
								'group-block-extended'
							) }
							value={ overlayHoverOpacity ?? 50 }
							onChange={ ( value ) =>
								setAttributes( { overlayHoverOpacity: value } )
							}
							min={ 0 }
							max={ 100 }
							step={ 10 }
						/>
					</>
				) }
			</PanelColorSettings>
		</>
	);
}
