<?php
/**
 * Plugin Name: Group Block Extended
 * Description: Non-destructively extends the core Group block with aspect ratio control and linked group functionality.
 * Version:     1.0.0
 * Author:      Phil Hoyt
 * License:     GPL-2.0-or-later
 * Requires at least: 6.4
 * Requires PHP: 8.0
 * Text Domain: group-block-extended
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register custom attributes on core/group via block_type_metadata filter.
 */
add_filter( 'block_type_metadata', function ( array $metadata ): array {
	if ( ( $metadata['name'] ?? '' ) !== 'core/group' ) {
		return $metadata;
	}

	$metadata['attributes'] = array_merge(
		$metadata['attributes'] ?? [],
		[
			'groupAspectRatio'   => [ 'type' => 'string',  'default' => '' ],
			'groupLinkUrl'       => [ 'type' => 'string',  'default' => '' ],
			'groupLinkNewTab'    => [ 'type' => 'boolean', 'default' => false ],
			'groupLinkRel'       => [ 'type' => 'string',  'default' => '' ],
			'groupLinkAriaLabel' => [ 'type' => 'string',  'default' => '' ],
			'groupLinkToPost'    => [ 'type' => 'boolean', 'default' => false ],
		]
	);

	return $metadata;
} );

/**
 * Enqueue editor assets.
 */
add_action( 'enqueue_block_editor_assets', function (): void {
	$asset_file = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';

	if ( ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = require $asset_file;

	wp_enqueue_script(
		'group-block-extended-editor',
		plugin_dir_url( __FILE__ ) . 'build/index.js',
		$asset['dependencies'],
		$asset['version']
	);

	wp_enqueue_style(
		'group-block-extended-editor',
		plugin_dir_url( __FILE__ ) . 'build/index.css',
		[],
		$asset['version']
	);
} );

/**
 * Enqueue frontend styles.
 */
add_action( 'wp_enqueue_scripts', function (): void {
	wp_enqueue_style(
		'group-block-extended',
		plugin_dir_url( __FILE__ ) . 'style.css',
		[],
		'1.0.0'
	);
} );

/**
 * Server-side render filter for core/group.
 *
 * Handles:
 * 1. groupLinkToPost — wraps block output in an <a> pointing to the post permalink.
 * 2. groupAspectRatio — injects aspect-ratio inline style onto the wrapper element.
 *
 * Static link URLs are written into saved HTML by the JS getSaveElement filter,
 * so this filter only needs to handle the dynamic Query Loop case.
 */
add_filter( 'render_block_core/group', function ( string $block_content, array $block ): string {
	static $link_depth = 0;

	$attrs = $block['attrs'] ?? [];

	// ── Aspect Ratio ──────────────────────────────────────────────────────────
	$aspect_ratio = $attrs['groupAspectRatio'] ?? '';

	if ( $aspect_ratio !== '' ) {
		$css_value = group_block_extended_ratio_to_css( $aspect_ratio );

		if ( $css_value !== '' ) {
			$processor = new WP_HTML_Tag_Processor( $block_content );

			if ( $processor->next_tag() ) {
				$existing_style = $processor->get_attribute( 'style' ) ?? '';
				$separator      = ( $existing_style !== '' && ! str_ends_with( trim( $existing_style ), ';' ) ) ? '; ' : '';
				$processor->set_attribute( 'style', $existing_style . $separator . 'aspect-ratio: ' . $css_value . ';' );
				$block_content = $processor->get_updated_html();
			}
		}
	}

	// ── Link to Post (Query Loop) ─────────────────────────────────────────────
	$link_to_post = ! empty( $attrs['groupLinkToPost'] );

	if ( ! $link_to_post || $link_depth > 0 ) {
		return $block_content;
	}

	$permalink = get_the_permalink();

	if ( ! $permalink ) {
		return $block_content;
	}

	$link_new_tab   = ! empty( $attrs['groupLinkNewTab'] );
	$link_rel       = sanitize_text_field( $attrs['groupLinkRel'] ?? '' );
	$link_aria      = $attrs['groupLinkAriaLabel'] ?? '';

	// Default aria-label to post title in Query Loop context.
	if ( $link_aria === '' ) {
		$link_aria = get_the_title();
	}

	/**
	 * Filters the aria-label for a linked group in Query Loop context.
	 *
	 * @param string $link_aria  The computed aria-label (defaults to post title).
	 * @param array  $attrs      Block attributes.
	 */
	$link_aria = apply_filters( 'group_block_extended_link_aria_label', $link_aria, $attrs );

	// Build rel attribute.
	$rel_parts = array_filter( explode( ' ', $link_rel ) );
	if ( $link_new_tab ) {
		$rel_parts = array_unique( array_merge( $rel_parts, [ 'noopener', 'noreferrer' ] ) );
	}
	$rel_attr = implode( ' ', $rel_parts );

	$target_attr = $link_new_tab ? ' target="_blank"' : '';
	$rel_attr    = $rel_attr !== '' ? ' rel="' . esc_attr( $rel_attr ) . '"' : '';
	$aria_attr   = $link_aria !== '' ? ' aria-label="' . esc_attr( $link_aria ) . '"' : '';

	$link_open  = '<a href="' . esc_url( $permalink ) . '" class="wp-block-group-link"' . $target_attr . $rel_attr . $aria_attr . '>';
	$link_close = '</a>';

	$link_depth++;
	$output = $link_open . $block_content . $link_close;
	$link_depth--;

	return $output;
}, 10, 2 );

/**
 * Convert a ratio string like "16:9" to a CSS aspect-ratio value like "16/9".
 */
function group_block_extended_ratio_to_css( string $ratio ): string {
	if ( preg_match( '/^(\d+(?:\.\d+)?)\s*[:\\/]\s*(\d+(?:\.\d+)?)$/', trim( $ratio ), $matches ) ) {
		return $matches[1] . '/' . $matches[2];
	}

	return '';
}
