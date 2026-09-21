<?php
/**
 * Plugin Name: Group Block Extended
 * Description: Extends the core Group block with aspect ratio, linked groups, hover colors, overlay, height control, and a space-around justification option, plus admin defaults for new groups.
 * Version:     1.3.0
 * Author:      Phil Hoyt
 * License:     GPL-2.0-or-later
 * Requires at least: 7.0
 * Requires PHP: 8.0
 * Text Domain: group-block-extended
 *
 * @package GroupBlockExtended
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'GROUP_BLOCK_EXTENDED_VERSION', '1.3.0' );

require_once __DIR__ . '/lib/plugin-update-checker/plugin-update-checker.php';

use YahnisElsts\PluginUpdateChecker\v5\PucFactory;

/**
 * Check GitHub releases for plugin updates.
 */
$group_block_extended_update_checker = PucFactory::buildUpdateChecker(
	'https://github.com/philhoyt/group-block-extended/',
	__FILE__,
	'group-block-extended'
);
$group_block_extended_vcs_api        = $group_block_extended_update_checker->getVcsApi();
if ( method_exists( $group_block_extended_vcs_api, 'enableReleaseAssets' ) ) {
	$group_block_extended_vcs_api->enableReleaseAssets();
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
			$metadata['attributes'] ?? array(),
			array(
				'groupAspectRatio'     => array(
					'type'    => 'string',
					'default' => '',
				),
				'groupLinkUrl'         => array(
					'type'    => 'string',
					'default' => '',
				),
				'groupLinkNewTab'      => array(
					'type'    => 'boolean',
					'default' => false,
				),
				'groupLinkRel'         => array(
					'type'    => 'string',
					'default' => '',
				),
				'groupLinkAriaLabel'   => array(
					'type'    => 'string',
					'default' => '',
				),
				'groupLinkTitle'       => array(
					'type'    => 'string',
					'default' => '',
				),
				'groupLinkToPost'      => array(
					'type'    => 'boolean',
					'default' => false,
				),
				'hoverTextColor'       => array(
					'type'    => 'string',
					'default' => '',
				),
				'hoverBackgroundColor' => array(
					'type'    => 'string',
					'default' => '',
				),
				'hoverLinkColor'       => array(
					'type'    => 'string',
					'default' => '',
				),
				'overlayColor'         => array(
					'type'    => 'string',
					'default' => '',
				),
				'overlayOpacity'       => array(
					'type'    => 'integer',
					'default' => 50,
				),
				'overlayHoverColor'    => array(
					'type'    => 'string',
					'default' => '',
				),
				'overlayHoverOpacity'  => array(
					'type'    => 'integer',
					'default' => 50,
				),
			)
		);

		// Needed so the editor passes postId/postType context into the block,
		// enabling the Query Loop URL preview via useEntityProp.
		$metadata['usesContext'] = array_unique(
			array_merge(
				$metadata['usesContext'] ?? array(),
				array( 'queryId', 'postId', 'postType' )
			)
		);

		return $metadata;
	}
);

/**
 * Register plugin settings.
 */
add_action(
	'admin_init',
	function (): void {
		register_setting(
			'group_block_extended_settings',
			'group_block_extended_default_alignment',
			array(
				'type'              => 'string',
				'default'           => '',
				'sanitize_callback' => function ( $value ) {
					return in_array( $value, array( '', 'wide', 'full' ), true ) ? $value : '';
				},
			)
		);

		register_setting(
			'group_block_extended_settings',
			'group_block_extended_disable_content_width',
			array(
				'type'              => 'boolean',
				'default'           => false,
				'sanitize_callback' => 'rest_sanitize_boolean',
			)
		);

		add_settings_section(
			'group_block_extended_general',
			'',
			'__return_null',
			'group-block-extended'
		);

		add_settings_field(
			'group_block_extended_default_alignment',
			__( 'Default Alignment', 'group-block-extended' ),
			function (): void {
				$value = get_option( 'group_block_extended_default_alignment', '' );
				?>
				<select name="group_block_extended_default_alignment">
					<option value="" <?php selected( $value, '' ); ?>><?php esc_html_e( 'None', 'group-block-extended' ); ?></option>
					<option value="wide" <?php selected( $value, 'wide' ); ?>><?php esc_html_e( 'Wide', 'group-block-extended' ); ?></option>
					<option value="full" <?php selected( $value, 'full' ); ?>><?php esc_html_e( 'Full Width', 'group-block-extended' ); ?></option>
				</select>
				<p class="description"><?php esc_html_e( 'Set the default alignment for new Group blocks.', 'group-block-extended' ); ?></p>
				<?php
			},
			'group-block-extended',
			'group_block_extended_general'
		);

		add_settings_field(
			'group_block_extended_disable_content_width',
			__( 'Content Width', 'group-block-extended' ),
			function (): void {
				$value = get_option( 'group_block_extended_disable_content_width', false );
				?>
				<label>
					<input type="checkbox" name="group_block_extended_disable_content_width" value="1" <?php checked( $value ); ?> />
					<?php esc_html_e( 'Disable "Inner blocks use content width" by default for new Group blocks.', 'group-block-extended' ); ?>
				</label>
				<?php
			},
			'group-block-extended',
			'group_block_extended_general'
		);
	}
);

/**
 * Add settings page under Settings menu.
 */
add_action(
	'admin_menu',
	function (): void {
		add_options_page(
			__( 'Group Block Extended', 'group-block-extended' ),
			__( 'Group Block Extended', 'group-block-extended' ),
			'manage_options',
			'group-block-extended',
			function (): void {
				?>
				<div class="wrap">
					<h1><?php esc_html_e( 'Group Block Extended', 'group-block-extended' ); ?></h1>
					<form method="post" action="options.php">
						<?php
						settings_fields( 'group_block_extended_settings' );
						do_settings_sections( 'group-block-extended' );
						submit_button();
						?>
					</form>
				</div>
				<?php
			}
		);
	}
);

/**
 * Enqueue editor JS.
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

		/**
		 * Filters the default alignment for new Group blocks.
		 *
		 * @param string $alignment The default alignment ('', 'wide', or 'full').
		 */
		$default_alignment = apply_filters(
			'group_block_extended_default_alignment',
			get_option( 'group_block_extended_default_alignment', '' )
		);

		/**
		 * Filters whether to disable content width constraint by default for new Group blocks.
		 *
		 * @param bool $disable Whether to disable content width by default.
		 */
		$disable_content_width = apply_filters(
			'group_block_extended_disable_content_width',
			(bool) get_option( 'group_block_extended_disable_content_width', false )
		);

		wp_add_inline_script(
			'group-block-extended-editor',
			'window.groupBlockExtended = ' . wp_json_encode(
				array(
					'defaultAlignment'    => (string) $default_alignment,
					'disableContentWidth' => (bool) $disable_content_width,
				)
			) . ';',
			'before'
		);
	}
);

/**
 * Enqueue editor CSS via enqueue_block_assets so it is injected into the
 * editor iframe (the block canvas), not just the outer admin page.
 */
add_action(
	'enqueue_block_assets',
	function (): void {
		if ( ! is_admin() ) {
			return;
		}

		$asset_file = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = require $asset_file;

		wp_enqueue_style(
			'group-block-extended-editor',
			plugin_dir_url( __FILE__ ) . 'build/index.css',
			array(),
			$asset['version']
		);
	}
);

/**
 * Register the frontend stylesheet as a block style so it is only loaded on
 * pages that render a Group or Navigation block (block themes load block
 * styles on demand; classic themes fall back to loading it on every page).
 */
add_action(
	'init',
	function (): void {
		$style_args = array(
			'handle' => 'group-block-extended',
			'src'    => plugin_dir_url( __FILE__ ) . 'style.css',
			'path'   => plugin_dir_path( __FILE__ ) . 'style.css',
			'ver'    => GROUP_BLOCK_EXTENDED_VERSION,
		);

		wp_enqueue_block_style( 'core/group', $style_args );
		wp_enqueue_block_style( 'core/navigation', $style_args );
	}
);

/**
 * Server-side render filter for core/navigation.
 *
 * Adds the items-justified-space-around class when justifyContent is space-around,
 * matching the navigation block's own items-justified-* class pattern.
 */
add_filter(
	'render_block_core/navigation',
	function ( string $block_content, array $block ): string {
		$attrs  = $block['attrs'] ?? array();
		$layout = $attrs['layout'] ?? array();

		if ( 'space-around' !== ( $layout['justifyContent'] ?? '' ) ) {
			return $block_content;
		}

		$processor = new WP_HTML_Tag_Processor( $block_content );

		if ( $processor->next_tag() ) {
			$processor->add_class( 'items-justified-space-around' );
			$block_content = $processor->get_updated_html();
		}

		return $block_content;
	},
	10,
	2
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
		$attrs = $block['attrs'] ?? array();

		// Collect wrapper classes and inline declarations, then apply them in a
		// single pass to the .wp-block-group element (never the <a> wrapper that
		// the editor writes around static linked groups).
		$classes      = array();
		$declarations = array();

		// ── Hover Colors ──────────────────────────────────────────────────────────
		$hover_map = array(
			'hoverTextColor'       => '--hover-text-color',
			'hoverBackgroundColor' => '--hover-background-color',
			'hoverLinkColor'       => '--hover-link-color',
		);

		foreach ( $hover_map as $attr_key => $css_prop ) {
			$color = group_block_extended_sanitize_color( group_block_extended_attr_string( $attrs, $attr_key ) );
			if ( '' !== $color ) {
				$declarations[ $css_prop ] = $color;
			}
		}

		if ( isset( $declarations['--hover-text-color'] ) || isset( $declarations['--hover-background-color'] ) || isset( $declarations['--hover-link-color'] ) ) {
			$classes[] = 'has-hover-colors';
		}
		if ( isset( $declarations['--hover-background-color'] ) ) {
			$classes[] = 'has-hover-bg-color';
		}

		// ── Overlay (default + hover state) ───────────────────────────────────────
		$overlay_color = group_block_extended_sanitize_color( group_block_extended_attr_string( $attrs, 'overlayColor' ) );

		if ( '' !== $overlay_color ) {
			$classes[]                               = 'has-overlay';
			$declarations['--overlay-color']         = $overlay_color;
			$declarations['--overlay-opacity']       = group_block_extended_clamp_opacity( $attrs['overlayOpacity'] ?? 50 );
			$declarations['--overlay-hover-opacity'] = group_block_extended_clamp_opacity( $attrs['overlayHoverOpacity'] ?? 50 );

			$overlay_hover_color = group_block_extended_sanitize_color( group_block_extended_attr_string( $attrs, 'overlayHoverColor' ) );
			if ( '' !== $overlay_hover_color ) {
				$declarations['--overlay-hover-color'] = $overlay_hover_color;
			}
		}

		// ── Layout: Space Around ─────────────────────────────────────────────────
		// WordPress core doesn't output CSS for justify-content: space-around, so
		// we inject it as an inline style which overrides the generated layout class.
		$layout = is_array( $attrs['layout'] ?? null ) ? $attrs['layout'] : array();

		if ( 'flex' === ( $layout['type'] ?? '' ) && 'space-around' === ( $layout['justifyContent'] ?? '' ) ) {
			$declarations['justify-content'] = 'space-around';
		}

		// ── Aspect Ratio ──────────────────────────────────────────────────────────
		$css_value = group_block_extended_ratio_to_css( group_block_extended_attr_string( $attrs, 'groupAspectRatio' ) );

		if ( '' !== $css_value ) {
			$declarations['aspect-ratio'] = $css_value;
		}

		if ( ! empty( $classes ) || ! empty( $declarations ) ) {
			$processor = new WP_HTML_Tag_Processor( $block_content );

			if ( $processor->next_tag( array( 'class_name' => 'wp-block-group' ) ) ) {
				foreach ( $classes as $class_name ) {
					$processor->add_class( $class_name );
				}
				group_block_extended_append_style( $processor, $declarations );
				$block_content = $processor->get_updated_html();
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
		// Inner blocks render before their parents, so a nested linked group has
		// already been wrapped by the time this runs; the strip below turns that
		// inner <a> into a <span>, leaving only the outermost group as a link.
		if ( ! $link_to_post ) {
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

		return $link_open . $block_content . $link_close;
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
	// Drop link-only attributes from every nested anchor so the resulting
	// <span> elements are valid HTML. The outermost anchor is left untouched.
	$processor = new WP_HTML_Tag_Processor( $html );
	$index     = 0;

	while ( $processor->next_tag( array( 'tag_name' => 'a' ) ) ) {
		if ( $has_outer_link && 0 === $index++ ) {
			continue;
		}
		foreach ( array( 'href', 'target', 'rel', 'download', 'hreflang', 'ping', 'referrerpolicy', 'type' ) as $attr ) {
			$processor->remove_attribute( $attr );
		}
	}

	$html = $processor->get_updated_html();

	if ( $has_outer_link ) {
		// Protect the outermost opening <a> (first occurrence).
		$html = preg_replace( '/<a\b/', "\x00GBE_OPEN\x00", $html, 1 );

		// Protect the outermost closing </a> (last occurrence).
		$last_close = strrpos( $html, '</a>' );
		if ( false !== $last_close ) {
			$html = substr_replace( $html, "\x00GBE_CLOSE\x00", $last_close, 4 );
		}
	}

	// Replace remaining <a …> with <span …> and </a> with </span>, collapsing
	// the whitespace left behind by the removed attributes.
	$html = preg_replace_callback(
		'/<a\b([^>]*)>/i',
		static function ( array $m ): string {
			$attrs = trim( preg_replace( '/\s+/', ' ', $m[1] ) );
			return '' === $attrs ? '<span>' : '<span ' . $attrs . '>';
		},
		$html
	);
	$html = preg_replace( '/<\/a>/i', '</span>', $html );

	if ( $has_outer_link ) {
		$html = str_replace( "\x00GBE_OPEN\x00", '<a', $html );
		$html = str_replace( "\x00GBE_CLOSE\x00", '</a>', $html );
	}

	return $html;
}

/**
 * Read a block attribute as a string, returning '' for anything non-scalar.
 *
 * Block comment JSON is user-controlled, so an attribute declared as a string
 * may still arrive as an array or object.
 *
 * @param array  $attrs Block attributes.
 * @param string $key   Attribute name.
 */
function group_block_extended_attr_string( array $attrs, string $key ): string {
	$value = $attrs[ $key ] ?? '';

	return is_scalar( $value ) ? (string) $value : '';
}

/**
 * Validate a CSS color value before it is written into an inline style.
 *
 * Accepts hex, rgb()/rgba(), hsl()/hsla(), and theme palette references
 * (var(--wp--preset--color--slug)). Anything else — including a value that
 * tries to smuggle in extra declarations — returns ''.
 *
 * @param string $value Raw attribute value.
 * @return string The validated color, or '' when invalid.
 */
function group_block_extended_sanitize_color( string $value ): string {
	$value = trim( $value );

	if ( '' === $value ) {
		return '';
	}

	$pattern = '/^(?:'
		. '#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})'
		. '|rgba?\([\d\s.,%\/]+\)'
		. '|hsla?\([\d\s.,%\/deg]+\)'
		. '|var\(--wp--preset--color--[a-z0-9-]+\)'
		. ')$/i';

	return preg_match( $pattern, $value ) ? $value : '';
}

/**
 * Clamp an opacity attribute to an integer between 0 and 100.
 *
 * @param mixed $value Raw attribute value.
 */
function group_block_extended_clamp_opacity( $value ): int {
	if ( ! is_numeric( $value ) ) {
		return 50;
	}

	return max( 0, min( 100, (int) $value ) );
}

/**
 * Append CSS declarations to the current tag's style attribute, skipping any
 * property that is already present (the editor's save filter writes the same
 * declarations into saved HTML, so this keeps the output idempotent).
 *
 * @param WP_HTML_Tag_Processor    $processor    Processor positioned on the target tag.
 * @param array<string,string|int> $declarations Map of CSS property => value.
 */
function group_block_extended_append_style( WP_HTML_Tag_Processor $processor, array $declarations ): void {
	$existing = $processor->get_attribute( 'style' );
	$existing = is_string( $existing ) ? trim( $existing ) : '';

	$additions = array();

	foreach ( $declarations as $prop => $value ) {
		if ( '' !== $existing && preg_match( '/(?:^|;)\s*' . preg_quote( $prop, '/' ) . '\s*:/i', $existing ) ) {
			continue;
		}
		$additions[] = $prop . ': ' . $value . ';';
	}

	if ( empty( $additions ) ) {
		return;
	}

	$separator = '';
	if ( '' !== $existing ) {
		$separator = str_ends_with( $existing, ';' ) ? ' ' : '; ';
	}

	$processor->set_attribute( 'style', $existing . $separator . implode( ' ', $additions ) );
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
