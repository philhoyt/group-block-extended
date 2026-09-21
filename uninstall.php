<?php
/**
 * Uninstall handler for Group Block Extended.
 *
 * Removes the options written by the settings page. Block attributes live in
 * post content and are intentionally left in place.
 *
 * @package GroupBlockExtended
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

delete_option( 'group_block_extended_default_alignment' );
delete_option( 'group_block_extended_disable_content_width' );
