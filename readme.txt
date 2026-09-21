=== Group Block Extended ===
Contributors:      philhoyt
Tags:              block, group, aspect ratio, linked block, card, overlay, hover
Requires at least: 7.0
Tested up to:      7.1
Stable tag:        1.3.0
Requires PHP:      8.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Extends the core Group block with aspect ratio, linked groups, hover colors, overlay, height control, and a space-around justification option. Everything is applied through filter hooks, with no block.json overrides.

== Description ==

Group Block Extended adds inspector panels to the core Group block without replacing or forking it. All enhancements are applied via WordPress filter hooks, so the block remains fully compatible with core updates.

= Aspect Ratio =

Set a fixed aspect ratio on any Group block using common presets or a custom value. Useful for card layouts, hero sections, and media containers where consistent proportions are required regardless of content height.

Presets: 1:1, 5:4, 4:3, 3:2, 16:9, 4:5, 3:4, 2:3, 9:16, or custom.

= Linked Group =

Turn any Group block into a clickable linked region, which is ideal for card components.

**Static link**: enter a URL directly. The group is wrapped in an `<a>` tag in saved HTML. Supports new tab, rel attributes, aria-label, and title.

**Link to post**: available inside Query Loop. Dynamically links to the current post's permalink via a PHP render filter, keeping the permalink out of saved HTML so it stays up to date automatically.

Both link modes automatically replace any nested `<a>` tags with `<span>` to prevent invalid HTML.

= Hover Colors =

Apply color changes on hover. Set hover values for text, background, and links independently. Changes are previewed live in the editor canvas.

= Overlay =

Add a color overlay that sits behind the group's content, above the background but below text and nested blocks, matching the behavior of the core Cover block.

Configure a default opacity and a separate hover opacity (and optionally a different hover color) to create smooth CSS transitions between states. Common use cases include a tint that darkens on hover, a color that reveals on hover, or a full color shift between states.

Hover colors and the overlay also respond to keyboard focus, so linked groups give the same feedback when tabbed to.

= Justification and Height =

Group and Navigation blocks with a flex layout get a fifth justification option, **Space around**, in the toolbar. Group blocks also get a **Height** control next to Min. Height in the Dimensions panel.

= Defaults for New Groups =

Under **Settings → Group Block Extended**, choose a default alignment (none, wide, or full) and whether new Group blocks start with "Inner blocks use content width" turned off. Both can also be set in code with the `group_block_extended_default_alignment` and `group_block_extended_disable_content_width` filters.

== Installation ==

1. Download the plugin zip.
2. In your WordPress dashboard go to **Plugins → Add New → Upload Plugin**.
3. Upload the zip and activate.

Alternatively, unzip into `wp-content/plugins/group-block-extended/` and activate from the Plugins screen.

== Frequently Asked Questions ==

= Does this replace or fork the core Group block? =

No. All attributes are registered via the `block_type_metadata` filter and all output changes are applied via `render_block_core/group`. The block's own `block.json` and save function are untouched.

= Will this cause block validation errors on update? =

No for aspect ratio and linked group: the save-element filter writes the same output as long as the same attributes are set. If you deactivate the plugin, blocks with a link or aspect ratio set will show a validation error, which can be resolved by removing those attributes before deactivating.

= Can I nest linked groups? =

Linking a Group that is already inside another linked Group is blocked in the editor with a warning. On the frontend the PHP render filter uses a depth counter to prevent nested `<a>` elements from being output.

= Does Link to Post work outside a Query Loop? =

No. The "Link to post" toggle is only available when the Group block is inside a Query Loop block. The toggle is hidden and the option has no effect otherwise.

= How does the overlay differ from setting a background color? =

The overlay uses a separate pseudo-element layered above the group's background but below its content. This means you can set a background image on the group and add an overlay tint on top of it, with the text remaining fully visible above both. It also supports independent default and hover states with a CSS transition between them.

== Changelog ==

= 1.3.0 =
* Security: Hover and overlay colors are validated before they are written to the page. Only hex, rgb, hsl, and theme palette colors are accepted, so a crafted block attribute can no longer add other CSS to the group.
* Fix: Pressing Cmd/Ctrl+Shift+K with a non-text block selected removed the link from every Group block in the post. It now only affects the selected block.
* Fix: The "Custom…" option in the Aspect Ratio panel now shows the text field instead of switching back to "None".
* Fix: The frontend stylesheet was cached at the 1.1.0 version on updated sites, so the 1.2.0 hover and navigation fixes could be missing until the cache cleared.
* Fix: Static linked groups no longer get hover, overlay, and aspect ratio styles applied to the link wrapper as well as the group, and nested links converted to plain text no longer keep link attributes.
* Add: Hover colors and overlays also respond to keyboard focus, so linked groups give the same feedback when tabbed to.
* Add: A "Linked" badge in the editor canvas marks groups that have a link.
* Add: `groupBlockExtended.queryBlocks` JavaScript filter to register other query-style blocks for "Link to post".
* Add: Removing the plugin now deletes its two settings.
* Change: The frontend stylesheet is only loaded on pages that render a Group or Navigation block.
* Change: Toolbar justification labels and the custom ratio placeholder are translatable, and the link popover returns focus to the toolbar when closed.
* Change: Link URLs and rel values are checked before saving. javascript: and data: URLs are rejected.

= 1.2.0 =
* Add: Settings page (Settings → Group Block Extended) to set the default alignment and turn off "Inner blocks use content width" for new Group blocks. Both defaults can also be set with the `group_block_extended_default_alignment` and `group_block_extended_disable_content_width` filters.
* Add: "Space around" option in the justification control for Group and Navigation blocks with a flex layout.
* Add: Height control in the Group block Dimensions panel, next to Min. Height.
* Add: Plugin updates are now delivered from GitHub releases through the WordPress updates screen.
* Change: WordPress 7.0 is now the minimum supported version.
* Fix: Hover colors now transition smoothly, and the hover background color no longer bleeds outside the block.
* Fix: "Space around" justification on Navigation blocks now applies in the editor and to the inner menu container.

= 1.1.0 =
* Added overlay feature: always-visible color layer behind group content with configurable default opacity, hover color, and hover opacity — CSS transition between states.
* Added hover color controls: text, background, and link colors on hover.
* Updated aspect ratio presets to: 1:1, 5:4, 4:3, 3:2, 16:9, 4:5, 3:4, 2:3, 9:16, custom.

= 1.0.0 =
* Initial release.
* Aspect ratio control with presets and custom input.
* Linked group with static URL support (new tab, rel, aria-label, title).
* Link to post for Query Loop context.
* Nested linked group detection and prevention.
* WordPress Coding Standards compliance.
