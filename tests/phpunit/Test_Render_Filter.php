<?php
/**
 * Integration tests for the core/group and core/navigation render filters.
 *
 * @package GroupBlockExtended
 */

/**
 * Renders group markup through do_blocks() and asserts on the output.
 */
class Test_Render_Filter extends WP_UnitTestCase {

	/**
	 * Build serialized group markup with the given attributes and inner HTML.
	 *
	 * @param array  $attrs      Block attributes.
	 * @param string $inner_html Inner HTML (defaults to a paragraph).
	 * @param string $wrapper    Wrapper HTML around the group div (static link case).
	 */
	private function group_markup( array $attrs, string $inner_html = '<p>Hi</p>', string $wrapper = '%s' ): string {
		$attrs['layout'] = $attrs['layout'] ?? array( 'type' => 'constrained' );
		$div             = '<div class="wp-block-group">' . $inner_html . '</div>';

		return '<!-- wp:group ' . wp_json_encode( $attrs ) . ' -->' . "\n"
			. sprintf( $wrapper, $div ) . "\n"
			. '<!-- /wp:group -->';
	}

	/**
	 * Extract the opening tag of the .wp-block-group element.
	 */
	private function group_tag( string $html ): string {
		preg_match( '/<div[^>]*class="[^"]*\bwp-block-group\b[^"]*"[^>]*>/', $html, $m );

		return $m[0] ?? '';
	}

	public function test_hover_colors_add_class_and_custom_properties(): void {
		$html = do_blocks(
			$this->group_markup(
				array(
					'hoverTextColor'       => '#ff0000',
					'hoverBackgroundColor' => 'rgb(1, 2, 3)',
					'hoverLinkColor'       => 'var(--wp--preset--color--primary)',
				)
			)
		);
		$tag  = $this->group_tag( $html );

		$this->assertStringContainsString( 'has-hover-colors', $tag );
		$this->assertStringContainsString( 'has-hover-bg-color', $tag );
		$this->assertStringContainsString( '--hover-text-color: #ff0000;', $tag );
		$this->assertStringContainsString( '--hover-background-color: rgb(1, 2, 3);', $tag );
		$this->assertStringContainsString( '--hover-link-color: var(--wp--preset--color--primary);', $tag );
	}

	public function test_declarations_already_saved_by_the_editor_are_not_duplicated(): void {
		$attrs  = array(
			'hoverTextColor'   => '#ff0000',
			'overlayColor'     => '#000000',
			'overlayOpacity'   => 30,
			'groupAspectRatio' => '16:9',
		);
		$markup = '<!-- wp:group ' . wp_json_encode( $attrs + array( 'layout' => array( 'type' => 'constrained' ) ) ) . ' -->' . "\n"
			. '<div class="wp-block-group has-hover-colors has-overlay" style="aspect-ratio:16/9;--hover-text-color:#ff0000;--overlay-color:#000000;--overlay-opacity:30;--overlay-hover-opacity:50"><p>Hi</p></div>' . "\n"
			. '<!-- /wp:group -->';

		$tag = $this->group_tag( do_blocks( $markup ) );

		$this->assertSame( 1, substr_count( $tag, '--hover-text-color' ) );
		$this->assertSame( 1, substr_count( $tag, '--overlay-color' ) );
		$this->assertSame( 1, substr_count( $tag, 'aspect-ratio' ) );
		$this->assertSame( 1, substr_count( $tag, 'has-hover-colors' ) );
	}

	public function test_invalid_color_values_are_dropped(): void {
		$html = do_blocks(
			$this->group_markup(
				array(
					'hoverTextColor' => 'red; background-image:url(https://evil.example/x.png)',
					'overlayColor'   => 'expression(alert(1))',
				)
			)
		);
		$tag  = $this->group_tag( $html );

		$this->assertStringNotContainsString( 'evil.example', $html );
		$this->assertStringNotContainsString( 'expression', $html );
		$this->assertStringNotContainsString( 'has-hover-colors', $tag );
		$this->assertStringNotContainsString( 'has-overlay', $tag );
		$this->assertStringNotContainsString( 'style=', $tag );
	}

	public function test_overlay_opacity_is_clamped(): void {
		$tag = $this->group_tag(
			do_blocks(
				$this->group_markup(
					array(
						'overlayColor'        => '#000',
						'overlayOpacity'      => 999,
						'overlayHoverOpacity' => -20,
					)
				)
			)
		);

		$this->assertStringContainsString( '--overlay-opacity: 100;', $tag );
		$this->assertStringContainsString( '--overlay-hover-opacity: 0;', $tag );
	}

	public function test_non_scalar_attributes_do_not_break_rendering(): void {
		$html = do_blocks(
			$this->group_markup(
				array(
					'hoverTextColor'   => array( '#fff' ),
					'overlayOpacity'   => array( 'a' => 1 ),
					'groupAspectRatio' => array( 1, 2 ),
					'layout'           => 'not-an-array',
				)
			)
		);

		$this->assertStringContainsString( '<p>Hi</p>', $html );
		$this->assertStringNotContainsString( 'style=', $this->group_tag( $html ) );
	}

	public function test_aspect_ratio_and_space_around_are_added_for_legacy_markup(): void {
		$tag = $this->group_tag(
			do_blocks(
				$this->group_markup(
					array(
						'groupAspectRatio' => '4:3',
						'layout'           => array(
							'type'           => 'flex',
							'justifyContent' => 'space-around',
						),
					)
				)
			)
		);

		$this->assertStringContainsString( 'aspect-ratio: 4/3;', $tag );
		$this->assertStringContainsString( 'justify-content: space-around;', $tag );
	}

	public function test_static_link_wrapper_is_left_untouched_and_nested_anchors_become_spans(): void {
		$html = do_blocks(
			$this->group_markup(
				array(
					'groupLinkUrl'     => 'https://example.com',
					'hoverTextColor'   => '#ff0000',
					'groupAspectRatio' => '16:9',
				),
				'<p><a href="#x" target="_blank" rel="noopener" class="inner">inner</a> <a href="#y">bare</a></p>',
				'<a href="https://example.com" class="wp-block-group-link">%s</a>'
			)
		);

		// Core's layout support may add its own classes to the wrapper on
		// classic themes; the plugin must add nothing of its own to the <a>.
		preg_match( '/^<a\b[^>]*>/', trim( $html ), $anchor );
		$this->assertNotEmpty( $anchor );
		$this->assertStringContainsString( 'href="https://example.com"', $anchor[0] );
		$this->assertStringContainsString( 'wp-block-group-link', $anchor[0] );
		$this->assertStringNotContainsString( 'style=', $anchor[0] );
		$this->assertStringNotContainsString( 'has-hover-colors', $anchor[0] );
		$this->assertStringEndsWith( '</div></a>', trim( $html ) );
		$this->assertStringContainsString( '<span class="inner">inner</span> <span>bare</span>', $html );
		$this->assertStringNotContainsString( 'href="#', $html );

		$tag = $this->group_tag( $html );
		$this->assertStringContainsString( 'has-hover-colors', $tag );
		$this->assertStringContainsString( 'aspect-ratio: 16/9;', $tag );
	}

	public function test_link_to_post_wraps_output_with_the_permalink(): void {
		$post_id = self::factory()->post->create(
			array(
				'post_title' => 'Hello & Goodbye',
			)
		);
		$this->go_to( get_permalink( $post_id ) );
		setup_postdata( get_post( $post_id ) );

		$html = do_blocks(
			$this->group_markup(
				array(
					'groupLinkToPost' => true,
					'groupLinkRel'    => 'nofollow',
					'groupLinkNewTab' => true,
				),
				'<p><a href="/inner">inner</a></p>'
			)
		);

		$this->assertStringStartsWith( '<a href="' . esc_url( get_permalink( $post_id ) ) . '" class="wp-block-group-link"', trim( $html ) );
		$this->assertStringContainsString( 'target="_blank"', $html );
		$this->assertStringContainsString( 'rel="nofollow noopener noreferrer"', $html );
		$this->assertStringContainsString( 'aria-label="Hello &amp; Goodbye"', $html );
		$this->assertStringContainsString( '<span>inner</span>', $html );
		$this->assertStringNotContainsString( 'href="/inner"', $html );

		wp_reset_postdata();
	}

	public function test_nested_link_to_post_groups_only_wrap_the_outermost(): void {
		$post_id = self::factory()->post->create();
		$this->go_to( get_permalink( $post_id ) );
		setup_postdata( get_post( $post_id ) );

		$inner = $this->group_markup( array( 'groupLinkToPost' => true ), '<p>Inner</p>' );
		$html  = do_blocks( $this->group_markup( array( 'groupLinkToPost' => true ), $inner ) );

		// Exactly one real anchor; the inner group's wrapper is demoted to a <span>.
		$this->assertSame( 1, preg_match_all( '/<a\b[^>]*wp-block-group-link/', $html ) );
		$this->assertSame( 1, preg_match_all( '/<span\b[^>]*wp-block-group-link/', $html ) );
		$this->assertStringStartsWith( '<a href=', trim( $html ) );

		wp_reset_postdata();
	}

	public function test_link_to_post_outside_a_post_context_renders_plain(): void {
		$GLOBALS['post'] = null; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$html            = do_blocks( $this->group_markup( array( 'groupLinkToPost' => true ) ) );

		$this->assertStringNotContainsString( 'wp-block-group-link', $html );
	}

	public function test_navigation_space_around_adds_class(): void {
		$markup = '<!-- wp:navigation {"layout":{"type":"flex","justifyContent":"space-around"}} /-->';
		$html   = do_blocks( $markup );

		$this->assertStringContainsString( 'items-justified-space-around', $html );
	}

	/**
	 * @dataProvider color_provider
	 */
	public function test_sanitize_color( string $input, string $expected ): void {
		$this->assertSame( $expected, group_block_extended_sanitize_color( $input ) );
	}

	public function color_provider(): array {
		return array(
			'hex 3'         => array( '#abc', '#abc' ),
			'hex 6 upper'   => array( '#ABCDEF', '#ABCDEF' ),
			'hex 8'         => array( '#aabbccdd', '#aabbccdd' ),
			'hex 5 invalid' => array( '#abcde', '' ),
			'rgb'           => array( 'rgb(255, 0, 0)', 'rgb(255, 0, 0)' ),
			'rgba'          => array( 'rgba(255,0,0,.5)', 'rgba(255,0,0,.5)' ),
			'hsl'           => array( 'hsl(120deg 50% 50% / 0.5)', 'hsl(120deg 50% 50% / 0.5)' ),
			'preset var'    => array( 'var(--wp--preset--color--vivid-red)', 'var(--wp--preset--color--vivid-red)' ),
			'other var'     => array( 'var(--anything)', '' ),
			'named color'   => array( 'red', '' ),
			'injection'     => array( '#fff; color: red', '' ),
			'url'           => array( 'url(https://example.com)', '' ),
			'whitespace'    => array( '  #fff  ', '#fff' ),
			'empty'         => array( '', '' ),
		);
	}

	/**
	 * @dataProvider ratio_provider
	 */
	public function test_ratio_to_css( string $input, string $expected ): void {
		$this->assertSame( $expected, group_block_extended_ratio_to_css( $input ) );
	}

	public function ratio_provider(): array {
		return array(
			array( '16:9', '16/9' ),
			array( '4/3', '4/3' ),
			array( ' 2.5 : 1 ', '2.5/1' ),
			array( '16:9; color:red', '' ),
			array( 'abc', '' ),
			array( '', '' ),
		);
	}

	public function test_uninstall_removes_options(): void {
		update_option( 'group_block_extended_default_alignment', 'wide' );
		update_option( 'group_block_extended_disable_content_width', true );

		if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
			define( 'WP_UNINSTALL_PLUGIN', 'group-block-extended/group-block-extended.php' );
		}
		require dirname( __DIR__, 2 ) . '/uninstall.php';

		$this->assertFalse( get_option( 'group_block_extended_default_alignment' ) );
		$this->assertFalse( get_option( 'group_block_extended_disable_content_width' ) );
	}
}
