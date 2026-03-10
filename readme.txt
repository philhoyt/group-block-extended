=== Group Block Extended ===
Contributors:      philhoyt
Tags:              block, group, aspect ratio, linked block, card
Requires at least: 6.4
Tested up to:      6.9.1
Stable tag:        1.0.0
Requires PHP:      8.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Extends the core Group block with aspect ratio control and linked group functionality — non-destructively, with no block.json overrides.

== Description ==

Group Block Extended adds two inspector panels to the core Group block without replacing or forking it. All enhancements are applied via WordPress filter hooks, so the block remains fully compatible with core updates.

= Aspect Ratio =

Set a fixed aspect ratio on any Group block using common presets or a custom value. Useful for card layouts, hero sections, and media containers where consistent proportions are required regardless of content height.

Presets: 1:1, 4:3, 3:2, 16:9, 2:1, 21:9, or custom.

= Linked Group =

Turn any Group block into a clickable linked region — ideal for card components.

**Static link** — enter a URL directly. The group is wrapped in an `<a>` tag in saved HTML. Supports new tab, rel attributes, aria-label, and title.

**Link to post** — available inside Query Loop. Dynamically links to the current post's permalink via a PHP render filter, keeping the permalink out of saved HTML so it stays up to date automatically.

Both link modes automatically replace any nested `<a>` tags with `<span>` to prevent invalid HTML.

== Installation ==

1. Download the plugin zip.
2. In your WordPress dashboard go to **Plugins → Add New → Upload Plugin**.
3. Upload the zip and activate.

Alternatively, unzip into `wp-content/plugins/group-block-extended/` and activate from the Plugins screen.

== Frequently Asked Questions ==

= Does this replace or fork the core Group block? =

No. All attributes are registered via the `block_type_metadata` filter and all output changes are applied via `render_block_core/group`. The block's own `block.json` and save function are untouched.

= Will this cause block validation errors on update? =

No for aspect ratio and linked group — the save-element filter writes the same output as long as the same attributes are set. If you deactivate the plugin, blocks with a link or aspect ratio set will show a validation error, which can be resolved by removing those attributes before deactivating.

= Can I nest linked groups? =

Linking a Group that is already inside another linked Group is blocked in the editor with a warning. On the frontend the PHP render filter uses a depth counter to prevent nested `<a>` elements from being output.

= Does Link to Post work outside a Query Loop? =

No. The "Link to post" toggle is only available when the Group block is inside a Query Loop block. The toggle is hidden and the option has no effect otherwise.

== Changelog ==

= 1.0.0 =
* Initial release.
* Aspect ratio control with presets and custom input.
* Linked group with static URL support (new tab, rel, aria-label, title).
* Link to post for Query Loop context.
* Nested linked group detection and prevention.
* WordPress Coding Standards compliance.
