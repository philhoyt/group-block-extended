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
 *
 * @package GroupBlockExtended
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register custom attributes and context on core/group via block_type_metadata filter.
 */
add_filter(
	'block_type_metadata',
	function ( array $metadata ): array {
		if ( ( $metadata['name'] ?? '' ) !== 'core/group' ) {
			return $metadata;
		}

		$metadata['attributes'] = array_merge(
			$metadata['attributes'] ?? [],
			[
				'groupAspectRatio'     => [ 'type' => 'string',  'default' => '' ],
				'groupLinkUrl'         => [ 'type' => 'string',  'default' => '' ],
				'groupLinkNewTab'      => [ 'type' => 'boolean', 'default' => false ],
				'groupLinkRel'         => [ 'type' => 'string',  'default' => '' ],
				'groupLinkAriaLabel'   => [ 'type' => 'string',  'default' => '' ],
				'groupLinkTitle'       => [ 'type' => 'string',  'default' => '' ],
				'groupLinkToPost'      => [ 'type' => 'boolean', 'default' => false ],
				'hoverTextColor'       => [ 'type' => 'string',  'default' => '' ],
				'hoverBackgroundColor' => [ 'type' => 'string',  'default' => '' ],
				'hoverLinkColor'       => [ 'type' => 'string',  'default' => '' ],
			]
		);

		// Needed so the editor passes postId/postType context into the block,
		// enabling the Query Loop URL preview via useEntityProp.
		$metadata['usesContext'] = array_unique( array_merge(
			$metadata['usesContext'] ?? [],
			[ 'queryId', 'postId', 'postType' ]
		) );

		return $metadata;
	}
);

/**
 * Enqueue editor assets.
 */
add_action(
	'enqueue_block_editor_assets',
	function (): void {
		$asset_file = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_script(
			'group-block-extended-editor',
			plugin_dir_url( __FILE__ ) . 'build/index.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style(
			'group-block-extended-editor',
			plugin_dir_url( __FILE__ ) . 'build/index.css',
			array(),
			$asset['version']
		);
	}
);

/**
 * Enqueue frontend styles.
 */
add_action(
	'wp_enqueue_scripts',
	function (): void {
		wp_enqueue_style(
			'group-block-extended',
			plugin_dir_url( __FILE__ ) . 'style.css',
			array(),
			'1.0.0'
		);
	}
);

/**
 * Server-side render filter for core/group.
 *
 * Handles:
 * 1. groupAspectRatio    — injects aspect-ratio inline style onto the wrapper element.
 * 2. groupLinkUrl        — strips nested <a> tags to keep HTML valid (the <a> wrapper
 *                          itself is already written into saved HTML by getSaveElement).
 * 3. groupLinkToPost     — strips nested <a> tags, then wraps output with an <a> pointing
 *                          to the post permalink (Query Loop dynamic case).
 */
add_filter(
	'render_block_core/group',
	function ( string $block_content, array $block ): string {
		static $link_depth = 0;

		$attrs = $block['attrs'] ?? array();

	// ── Hover Colors ──────────────────────────────────────────────────────────
	$hover_vars = array_filter( [
		'--hover-text-color'       => $attrs['hoverTextColor']       ?? '',
		'--hover-background-color' => $attrs['hoverBackgroundColor'] ?? '',
		'--hover-link-color'       => $attrs['hoverLinkColor']       ?? '',
	] );

	if ( ! empty( $hover_vars ) ) {
		$hover_processor = new WP_HTML_Tag_Processor( $block_content );

		if ( $hover_processor->next_tag() ) {
			$hover_processor->add_class( 'has-hover-colors' );

			$existing_style  = $hover_processor->get_attribute( 'style' ) ?? '';
			$separator       = ( $existing_style !== '' && ! str_ends_with( trim( $existing_style ), ';' ) ) ? '; ' : '';
			$css_vars        = '';
			foreach ( $hover_vars as $prop => $value ) {
				$css_vars .= $prop . ': ' . $value . '; ';
			}
			$hover_processor->set_attribute( 'style', $existing_style . $separator . trim( $css_vars ) );
			$block_content = $hover_processor->get_updated_html();
		}
	}

	// ── Aspect Ratio ──────────────────────────────────────────────────────────
	$aspect_ratio = $attrs['groupAspectRatio'] ?? '';

		if ( '' !== $aspect_ratio ) {
			$css_value = group_block_extended_ratio_to_css( $aspect_ratio );

			if ( '' !== $css_value ) {
				$processor = new WP_HTML_Tag_Processor( $block_content );

				if ( $processor->next_tag() ) {
					$existing_style = $processor->get_attribute( 'style' ) ?? '';
					$separator      = ( '' !== $existing_style && ! str_ends_with( trim( $existing_style ), ';' ) ) ? '; ' : '';
					$processor->set_attribute( 'style', $existing_style . $separator . 'aspect-ratio: ' . $css_value . ';' );
					$block_content = $processor->get_updated_html();
				}
			}
		}

		$has_static_link = ! empty( $attrs['groupLinkUrl'] );
		$link_to_post    = ! empty( $attrs['groupLinkToPost'] );

		// ── Static Link: strip nested anchors ────────────────────────────────────
		// The outer <a class="wp-block-group-link"> is already in saved HTML.
		// Any <a> tags inside it produce invalid HTML — replace them with <span>.
		if ( $has_static_link ) {
			$block_content = group_block_extended_strip_nested_anchors( $block_content, true );
		}

		// ── Link to Post (Query Loop) ─────────────────────────────────────────────
		if ( ! $link_to_post || $link_depth > 0 ) {
			return $block_content;
		}

		$permalink = get_the_permalink();

		if ( ! $permalink ) {
			return $block_content;
		}

		// Strip nested anchors from inner content before wrapping.
		$block_content = group_block_extended_strip_nested_anchors( $block_content, false );

		$link_new_tab = ! empty( $attrs['groupLinkNewTab'] );
		$link_rel     = sanitize_text_field( $attrs['groupLinkRel'] ?? '' );
		$link_aria    = $attrs['groupLinkAriaLabel'] ?? '';
		$link_title   = sanitize_text_field( $attrs['groupLinkTitle'] ?? '' );

		// Default aria-label to post title in Query Loop context.
		if ( '' === $link_aria ) {
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
			$rel_parts = array_unique( array_merge( $rel_parts, array( 'noopener', 'noreferrer' ) ) );
		}
		$rel_attr = implode( ' ', $rel_parts );

		$target_attr = $link_new_tab ? ' target="_blank"' : '';
		$rel_attr    = '' !== $rel_attr ? ' rel="' . esc_attr( $rel_attr ) . '"' : '';
		$aria_attr   = '' !== $link_aria ? ' aria-label="' . esc_attr( $link_aria ) . '"' : '';
		$title_attr  = '' !== $link_title ? ' title="' . esc_attr( $link_title ) . '"' : '';

		$link_open  = '<a href="' . esc_url( $permalink ) . '" class="wp-block-group-link"' . $target_attr . $rel_attr . $aria_attr . $title_attr . '>';
		$link_close = '</a>';

		$link_depth++;
		$output = $link_open . $block_content . $link_close;
		$link_depth--;

		return $output;
	},
	10,
	2
);

/**
 * Strip nested <a> elements by replacing them with <span>, preventing invalid HTML
 * when the group block is itself wrapped in an anchor.
 *
 * @param string $html           Rendered block HTML.
 * @param bool   $has_outer_link True when the HTML is already wrapped in an outer <a>
 *                               (static link case) — preserves that outermost tag.
 */
function group_block_extended_strip_nested_anchors( string $html, bool $has_outer_link = false ): string {
	if ( $has_outer_link ) {
		// Protect the outermost opening <a> (first occurrence).
		$html = preg_replace( '/<a\b/', "\x00GBE_OPEN\x00", $html, 1 );

		// Protect the outermost closing </a> (last occurrence).
		$last_close = strrpos( $html, '</a>' );
		if ( false !== $last_close ) {
			$html = substr_replace( $html, "\x00GBE_CLOSE\x00", $last_close, 4 );
		}
	}

	// Replace remaining <a …> with <span …> and </a> with </span>.
	$html = preg_replace( '/<a\b([^>]*)>/i', '<span$1>', $html );
	$html = preg_replace( '/<\/a>/i', '</span>', $html );

	if ( $has_outer_link ) {
		$html = str_replace( "\x00GBE_OPEN\x00", '<a', $html );
		$html = str_replace( "\x00GBE_CLOSE\x00", '</a>', $html );
	}

	return $html;
}

/**
 * Convert a ratio string like "16:9" to a CSS aspect-ratio value like "16/9".
 *
 * @param string $ratio The ratio string, e.g. "16:9" or "16/9".
 * @return string CSS aspect-ratio value, e.g. "16/9", or empty string if invalid.
 */
function group_block_extended_ratio_to_css( string $ratio ): string {
	if ( preg_match( '/^(\d+(?:\.\d+)?)\s*[:\\/]\s*(\d+(?:\.\d+)?)$/', trim( $ratio ), $matches ) ) {
		return $matches[1] . '/' . $matches[2];
	}

	return '';
}
