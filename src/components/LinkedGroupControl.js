import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl, TextControl, Notice, Button, ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __experimentalLinkControl as LinkControl } from '@wordpress/block-editor';
import { useEntityProp } from '@wordpress/core-data';

export default function LinkedGroupControl( { clientId, attributes, setAttributes, context } ) {
	const {
		groupLinkUrl,
		groupLinkNewTab,
		groupLinkRel,
		groupLinkAriaLabel,
		groupLinkTitle,
		groupLinkToPost,
	} = attributes;

	// Detect context: inside core/query and inside another linked group.
	const { isInsideQueryLoop, hasLinkedGroupAncestor, hasLinkedGroupDescendant } = useSelect(
		( select ) => {
			const { getBlockParents, getBlock, getClientIdsOfDescendants } = select( blockEditorStore );
			const parents = getBlockParents( clientId, /* ascending */ true );

			let insideQuery    = false;
			let linkedAncestor = false;

			for ( const parentId of parents ) {
				const parent = getBlock( parentId );
				if ( ! parent ) continue;
				if ( parent.name === 'core/query' ) insideQuery = true;
				if ( parent.name === 'core/group' && ( parent.attributes?.groupLinkUrl || parent.attributes?.groupLinkToPost ) ) {
					linkedAncestor = true;
				}
			}

			// Check descendants for linked groups.
			const descendantIds = getClientIdsOfDescendants( [ clientId ] );
			let linkedDescendant = false;
			for ( const id of descendantIds ) {
				const block = getBlock( id );
				if ( block?.name === 'core/group' && ( block.attributes?.groupLinkUrl || block.attributes?.groupLinkToPost ) ) {
					linkedDescendant = true;
					break;
				}
			}

			return {
				isInsideQueryLoop:        insideQuery,
				hasLinkedGroupAncestor:   linkedAncestor,
				hasLinkedGroupDescendant: linkedDescendant,
			};
		},
		[ clientId ]
	);

	// Fetch the post permalink from the Query Loop context so we can preview it
	// in the editor. Falls back gracefully when context is unavailable.
	const postType = context?.postType;
	const postId   = context?.postId;
	const [ postUrl ] = useEntityProp( 'postType', postType, 'link', postId );

	const isDisabled    = hasLinkedGroupAncestor;
	const hasStaticLink = !! groupLinkUrl;
	const isLinked      = hasStaticLink || groupLinkToPost;

	// LinkControl value shape.
	const linkValue = {
		url:          groupLinkUrl || '',
		opensInNewTab: groupLinkNewTab,
	};

	function handleLinkChange( value ) {
		setAttributes( {
			groupLinkUrl:    value?.url    ?? '',
			groupLinkNewTab: value?.opensInNewTab ?? false,
		} );
	}

	function handleLinkRemove() {
		setAttributes( {
			groupLinkUrl:    '',
			groupLinkNewTab: false,
			groupLinkToPost: false,
			groupLinkTitle:  '',
		} );
	}

	return (
		<PanelBody
			title={ __( 'Linked Group', 'group-block-extended' ) }
			initialOpen={ isLinked }
		>
			{ isDisabled && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'This block is nested inside another linked group. Nested linked groups are not supported.',
						'group-block-extended'
					) }
				</Notice>
			) }

			{ hasLinkedGroupDescendant && ! isDisabled && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'This block contains a nested linked group. Only the outermost linked group will be active.',
						'group-block-extended'
					) }
				</Notice>
			) }

			{ ! isDisabled && (
				<>
					{ isInsideQueryLoop && (
						<>
							<ToggleControl
								label={ __( 'Link to post', 'group-block-extended' ) }
								help={ __(
									'Automatically links to the post permalink when used inside a Query Loop.',
									'group-block-extended'
								) }
								checked={ groupLinkToPost }
								onChange={ ( value ) => {
									setAttributes( {
										groupLinkToPost: value,
										// Clear static URL when enabling link-to-post.
										...( value ? { groupLinkUrl: '', groupLinkNewTab: false } : {} ),
									} );
								} }
							/>

							{ groupLinkToPost && postUrl && (
								<p className="gbe-post-url-preview">
									<ExternalLink href={ postUrl }>{ postUrl }</ExternalLink>
								</p>
							) }
						</>
					) }

					{ ! groupLinkToPost && (
						<div className="gbe-link-control-wrapper">
							<LinkControl
								value={ linkValue }
								onChange={ handleLinkChange }
								onRemove={ hasStaticLink ? handleLinkRemove : undefined }
								settings={ [
									{
										id:    'opensInNewTab',
										title: __( 'Open in new tab', 'group-block-extended' ),
									},
								] }
							/>
						</div>
					) }

					{ isLinked && (
						<>
							<TextControl
								label={ __( 'Aria label', 'group-block-extended' ) }
								value={ groupLinkAriaLabel }
								placeholder={
									isInsideQueryLoop && groupLinkToPost
										? __( 'Defaults to post title', 'group-block-extended' )
										: ''
								}
								help={ __(
									'Describe the link destination for screen reader users.',
									'group-block-extended'
								) }
								onChange={ ( value ) => setAttributes( { groupLinkAriaLabel: value } ) }
							/>

							<TextControl
								label={ __( 'Title attribute', 'group-block-extended' ) }
								value={ groupLinkTitle }
								help={ __(
									'Shown as a tooltip on hover in most browsers.',
									'group-block-extended'
								) }
								onChange={ ( value ) => setAttributes( { groupLinkTitle: value } ) }
							/>

							<TextControl
								label={ __( 'Rel attribute', 'group-block-extended' ) }
								value={ groupLinkRel }
								help={ __(
									'Additional rel values. noopener and noreferrer are added automatically when opening in a new tab.',
									'group-block-extended'
								) }
								onChange={ ( value ) => setAttributes( { groupLinkRel: value } ) }
							/>

							<Button
								variant="tertiary"
								isDestructive
								onClick={ handleLinkRemove }
								style={ { marginTop: '8px' } }
							>
								{ __( 'Remove link', 'group-block-extended' ) }
							</Button>
						</>
					) }
				</>
			) }
		</PanelBody>
	);
}
