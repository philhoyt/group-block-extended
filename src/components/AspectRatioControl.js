import { __ } from '@wordpress/i18n';
import { PanelBody, SelectControl, TextControl, Notice } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

const RATIO_PRESETS = [
	{ label: __( 'None', 'group-block-extended' ),   value: '' },
	{ label: __( '1:1', 'group-block-extended' ),    value: '1:1' },
	{ label: __( '4:3', 'group-block-extended' ),    value: '4:3' },
	{ label: __( '3:2', 'group-block-extended' ),    value: '3:2' },
	{ label: __( '16:9', 'group-block-extended' ),   value: '16:9' },
	{ label: __( '2:1', 'group-block-extended' ),    value: '2:1' },
	{ label: __( '21:9', 'group-block-extended' ),   value: '21:9' },
	{ label: __( 'Custom…', 'group-block-extended' ), value: 'custom' },
];

const PRESET_VALUES = RATIO_PRESETS.map( ( p ) => p.value ).filter( ( v ) => v !== '' && v !== 'custom' );

/**
 * Determine the SelectControl value from the stored groupAspectRatio string.
 */
function getSelectValue( groupAspectRatio ) {
	if ( ! groupAspectRatio ) return '';
	if ( PRESET_VALUES.includes( groupAspectRatio ) ) return groupAspectRatio;
	return 'custom';
}

export default function AspectRatioControl( { clientId, attributes, setAttributes } ) {
	const { groupAspectRatio } = attributes;

	const hasMinHeight = useSelect(
		( select ) => {
			const block = select( blockEditorStore ).getBlock( clientId );
			return !! ( block?.attributes?.style?.dimensions?.minHeight || block?.attributes?.minHeight );
		},
		[ clientId ]
	);

	const selectValue  = getSelectValue( groupAspectRatio );
	const isCustom     = selectValue === 'custom';

	function handleSelectChange( value ) {
		if ( value === 'custom' ) {
			// Keep current custom value if already custom, otherwise clear.
			setAttributes( { groupAspectRatio: isCustom ? groupAspectRatio : '' } );
		} else {
			setAttributes( { groupAspectRatio: value } );
		}
	}

	function handleCustomChange( value ) {
		setAttributes( { groupAspectRatio: value } );
	}

	return (
		<PanelBody
			title={ __( 'Aspect Ratio', 'group-block-extended' ) }
			initialOpen={ !! groupAspectRatio }
		>
			{ hasMinHeight && groupAspectRatio && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'A minimum height is also set on this block. Aspect ratio and minimum height may conflict.',
						'group-block-extended'
					) }
				</Notice>
			) }

			<SelectControl
				label={ __( 'Ratio', 'group-block-extended' ) }
				value={ selectValue }
				options={ RATIO_PRESETS }
				onChange={ handleSelectChange }
			/>

			{ isCustom && (
				<TextControl
					label={ __( 'Custom ratio', 'group-block-extended' ) }
					value={ groupAspectRatio }
					placeholder="e.g. 7:3"
					help={ __( 'Enter a ratio like 7:3 or 5:2.', 'group-block-extended' ) }
					onChange={ handleCustomChange }
				/>
			) }
		</PanelBody>
	);
}
