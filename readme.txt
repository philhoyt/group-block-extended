=== Group Block Extended ===
Contributors:      philhoyt
Tags:              block, group, aspect-ratio, linked-group, overlay
Requires at least: 7.0
Tested up to:      7.1
Stable tag:        1.3.2
Requires PHP:      8.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Adds aspect ratio, links, hover colors, an overlay, a height control, and space-around justification to the core Group block

== Description ==

Group Block Extended adds inspector panels and toolbar options to the core Group block. The attributes are registered through the `block_type_metadata` filter and the front-end output is changed through `render_block_core/group`, so the block's own block.json and save function stay as core ships them.

= Aspect ratio =

Set a fixed aspect ratio on a Group block from the presets 1:1, 5:4, 4:3, 3:2, 16:9, 4:5, 3:4, 2:3, and 9:16, or enter a custom value. The ratio is applied as an inline `aspect-ratio` style in the editor and in the saved HTML.

= Linked group =

Make the whole Group block a link. Two modes:

* Static link: enter a URL. The group is wrapped in an `<a>` tag in the saved HTML. Options for new tab, rel, aria-label, and title.
* Link to post: available when the Group is inside a Query Loop. A PHP render filter links the group to the current post's permalink, so the URL is not stored in the post content and stays current when permalinks change.

In both modes nested `<a>` tags are replaced with `<span>` so the HTML stays valid. Linking a Group that is already inside a linked Group is blocked in the editor, and the render filter refuses to output nested links on the front end. A "Linked" badge in the editor canvas marks groups that have a link.

= Hover colors =

Set separate hover colors for text, background, and links. The editor canvas previews the hover state.

= Overlay =

Add a color layer that sits above the group's background and below its content, the way the core Cover block's overlay does. Set a default opacity and a separate hover opacity, and optionally a different hover color; the change between states is a CSS transition. Hover colors and the overlay also respond to keyboard focus, so a linked group gives the same feedback when tabbed to.

= Justification and height =

Group and Navigation blocks with a flex layout get a fifth justification option, Space around, in the toolbar. Group blocks get a Height control next to Min. Height in the Dimensions panel.

= Defaults for new groups =

Under Settings > Group Block Extended, choose a default alignment (none, wide, or full) and whether new Group blocks start with "Inner blocks use content width" turned off. The same defaults can be set in code with the `group_block_extended_default_alignment` and `group_block_extended_disable_content_width` filters. Both options are deleted when the plugin is uninstalled.

== Installation ==

1. Download the plugin zip.
2. Go to Plugins > Add New > Upload Plugin, upload the zip, and activate.

Or unzip it into `wp-content/plugins/group-block-extended/` and activate from the Plugins screen. Updates are delivered from GitHub releases through Plugin Update Checker.

== Frequently Asked Questions ==

= Does this replace or fork the core Group block? =

No. Attributes are added through the `block_type_metadata` filter and output changes go through `render_block_core/group`. The block's block.json and save function are untouched.

= Will this cause block validation errors on update? =

Not for aspect ratio and linked group: the save-element filter writes the same output as long as the same attributes are set. If you deactivate the plugin, blocks with a link or aspect ratio set will show a validation error. Remove those attributes before deactivating to avoid it.

= Can I nest linked groups? =

No. The editor shows a warning and blocks the link, and the front-end render filter tracks nesting depth so it never outputs an `<a>` inside another `<a>`.

= Does Link to post work outside a Query Loop? =

No. The toggle only appears when the Group is inside a Query Loop, and the option has no effect elsewhere. Other query-style blocks can be registered with the `groupBlockExtended.queryBlocks` JavaScript filter.

= How does the overlay differ from a background color? =

The overlay is a pseudo-element layered above the group's background and below its content, so you can put a background image on the group and an overlay tint on top of it with the text still readable above both. It also has separate default and hover states with a transition between them.

== Changelog ==

= 1.3.2 =
* Fixed the update checker so it always installs the release zip, not whichever file GitHub lists first.
* Rewrote the readme files in plain English.

= 1.3.1 =
* Tested against WordPress 7.1 and rebuilt with the current block editor toolchain.

= 1.3.0 =
* Security: validated hover and overlay colors before they are written to the page. Only hex, rgb, hsl, and theme palette colors are accepted, so a crafted block attribute can no longer add other CSS to the group.
* Fixed Cmd/Ctrl+Shift+K with a non-text block selected removing the link from every Group block in the post. It now only affects the selected block.
* Fixed the "Custom..." option in the Aspect Ratio panel switching back to "None" instead of showing the text field.
* Fixed the front-end stylesheet being cached at the 1.1.0 version on updated sites, which could hide the 1.2.0 hover and navigation fixes until the cache cleared.
* Fixed static linked groups getting hover, overlay, and aspect ratio styles on the link wrapper as well as the group, and nested links converted to plain text keeping link attributes.
* Added keyboard focus handling for hover colors and overlays, so linked groups give the same feedback when tabbed to.
* Added a "Linked" badge in the editor canvas for groups that have a link.
* Added the `groupBlockExtended.queryBlocks` JavaScript filter to register other query-style blocks for "Link to post".
* Added deletion of the plugin's two settings on uninstall.
* Changed the front-end stylesheet to load only on pages that render a Group or Navigation block.
* Made the toolbar justification labels and the custom ratio placeholder translatable, and returned focus to the toolbar when the link popover closes.
* Added checks on link URLs and rel values before saving. javascript: and data: URLs are rejected.

= 1.2.0 =
* Added a settings page (Settings > Group Block Extended) to set the default alignment and turn off "Inner blocks use content width" for new Group blocks. Both defaults can also be set with the `group_block_extended_default_alignment` and `group_block_extended_disable_content_width` filters.
* Added a "Space around" option to the justification control for Group and Navigation blocks with a flex layout.
* Added a Height control to the Group block Dimensions panel, next to Min. Height.
* Added plugin updates from GitHub releases through the WordPress updates screen.
* Raised the minimum WordPress version to 7.0.
* Fixed hover colors to transition instead of snapping, and stopped the hover background color bleeding outside the block.
* Fixed "Space around" justification on Navigation blocks so it applies in the editor and to the inner menu container.

= 1.1.0 =
* Added the overlay: a color layer behind the group content with a default opacity, a hover color, and a hover opacity, with a CSS transition between states.
* Added hover color controls for text, background, and link colors.
* Changed the aspect ratio presets to 1:1, 5:4, 4:3, 3:2, 16:9, 4:5, 3:4, 2:3, 9:16, and custom.

= 1.0.0 =
* Initial release.
* Added the aspect ratio control with presets and a custom input.
* Added linked groups with a static URL (new tab, rel, aria-label, title).
* Added Link to post for Groups inside a Query Loop.
* Added detection and prevention of nested linked groups.
