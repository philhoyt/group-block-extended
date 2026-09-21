import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { BlockControls, LinkControl } from '@wordpress/block-editor';
import {
	ToolbarButton,
	Popover,
	KeyboardShortcuts,
} from '@wordpress/components';
import { link, linkOff } from '@wordpress/icons';
import { rawShortcut, displayShortcut } from '@wordpress/keycodes';

import { sanitizeLinkUrl } from '../utils/link';

/**
 * Toolbar link button + popover. Only mount this for the selected block: the
 * keyboard shortcuts bind to document, not to the block.
 *
 * @param {Object}   props
 * @param {Object}   props.attributes
 * @param {Function} props.setAttributes
 */
export default function LinkedGroupToolbar( { attributes, setAttributes } ) {
	const { groupLinkUrl, groupLinkNewTab, groupLinkToPost } = attributes;

	const [ isOpen, setIsOpen ] = useState( false );
	const [ popoverAnchor, setAnchor ] = useState( null );
	const buttonRef = useRef( null );

	const isLinked = !! ( groupLinkUrl || groupLinkToPost );
	// Query Loop links are managed only from the sidebar panel.
	const isQueryLink = groupLinkToPost && ! groupLinkUrl;

	function handleLinkChange( value ) {
		setAttributes( {
			groupLinkUrl: sanitizeLinkUrl( value?.url ),
			groupLinkNewTab: value?.opensInNewTab ?? false,
		} );
	}

	function closePopover() {
		setIsOpen( false );
		// Return focus to the control that opened the popover.
		buttonRef.current?.focus();
	}

	function handleRemove() {
		setAttributes( {
			groupLinkUrl: '',
			groupLinkNewTab: false,
			groupLinkToPost: false,
		} );
		setIsOpen( false );
	}

	function handleToolbarClick() {
		if ( isLinked ) {
			handleRemove();
		} else {
			setIsOpen( ( prev ) => ! prev );
		}
	}

	return (
		<>
			<KeyboardShortcuts
				shortcuts={ {
					[ rawShortcut.primary( 'k' ) ]: ( e ) => {
						if ( ! isQueryLink ) {
							e.preventDefault();
							setIsOpen( true );
						}
					},
					[ rawShortcut.primaryShift( 'k' ) ]: ( e ) => {
						e.preventDefault();
						handleRemove();
					},
				} }
			/>

			<BlockControls group="block">
				<span ref={ setAnchor }>
					<ToolbarButton
						ref={ buttonRef }
						icon={ isLinked ? linkOff : link }
						label={
							isLinked
								? __( 'Remove link', 'group-block-extended' )
								: __( 'Link', 'group-block-extended' )
						}
						shortcut={
							isLinked
								? displayShortcut.primaryShift( 'k' )
								: displayShortcut.primary( 'k' )
						}
						isActive={ isLinked }
						onClick={ handleToolbarClick }
					/>
				</span>
			</BlockControls>

			{ isOpen && ! isQueryLink && popoverAnchor && (
				<Popover
					placement="bottom"
					anchor={ popoverAnchor }
					onClose={ closePopover }
					focusOnMount={ true }
					shift
				>
					<div className="gbe-toolbar-link-popover">
						<LinkControl
							value={ {
								url: groupLinkUrl,
								opensInNewTab: groupLinkNewTab,
							} }
							onChange={ handleLinkChange }
							onRemove={ groupLinkUrl ? handleRemove : undefined }
							settings={ [
								{
									id: 'opensInNewTab',
									title: __(
										'Open in new tab',
										'group-block-extended'
									),
								},
							] }
						/>
					</div>
				</Popover>
			) }
		</>
	);
}
