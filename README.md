# Group Block Extended

[![CI](https://github.com/philhoyt/group-block-extended/actions/workflows/ci.yml/badge.svg)](https://github.com/philhoyt/group-block-extended/actions/workflows/ci.yml)

A WordPress plugin that adds aspect ratio, links, hover colors, an overlay, a height control, space-around justification, and admin defaults for new groups to the core Group block.

## Requirements

- WordPress 7.0 or later
- PHP 8.0 or later

## Installation

Download the latest release zip and install it from Plugins > Add New > Upload Plugin, or unzip it into `wp-content/plugins/group-block-extended/`. Updates are offered from GitHub releases through Plugin Update Checker.

## Usage

The plugin does not register a block. It adds attributes to `core/group` through the `block_type_metadata` filter, adds inspector panels and toolbar controls in the editor, and rewrites the front-end markup through `render_block_core/group` (and `render_block_core/navigation` for the space-around option). Core's block.json and save function are not changed.

### Aspect ratio

Presets `1:1`, `5:4`, `4:3`, `3:2`, `16:9`, `4:5`, `3:4`, `2:3`, `9:16`, or a custom value. Applied as an inline `aspect-ratio` style in the editor canvas and in the saved HTML.

### Linked group

Static link: a URL entered in the inspector. The save-element filter wraps the group in `<a class="wp-block-group-link">` in the saved HTML, with options for new tab, `rel`, `aria-label`, and `title`. URLs and rel values are checked before saving; `javascript:` and `data:` URLs are rejected.

Link to post: shown only inside a Query Loop (or a block registered with the `groupBlockExtended.queryBlocks` JavaScript filter). The PHP render filter wraps the group in a link to the current post's permalink, so the URL is not stored in post content. The `aria-label` defaults to the post title and can be changed with the `group_block_extended_link_aria_label` PHP filter.

In both modes nested `<a>` tags become `<span>`. The editor blocks linking a Group inside a linked Group, and the render filter tracks depth so it never outputs nested anchors. A "Linked" badge in the canvas marks linked groups.

### Hover colors and overlay

Hover colors for text, background, and links, previewed in the editor canvas. The overlay is a pseudo-element above the group's background and below its content, with a default opacity, a hover opacity, and an optional hover color; the change between states is a CSS transition. Both respond to keyboard focus as well as hover. Color values are validated on render; only hex, rgb, hsl, and theme palette colors are written to the page.

### Justification and height

Group and Navigation blocks with a flex layout get a Space around justification option. Group blocks get a Height control next to Min. Height in the Dimensions panel.

### Defaults for new groups

Settings > Group Block Extended sets a default alignment (none, wide, full) and whether new Group blocks start with "Inner blocks use content width" off. The PHP filters `group_block_extended_default_alignment` and `group_block_extended_disable_content_width` set the same defaults in code. `uninstall.php` deletes both options.

The front-end stylesheet (`style.css`) is enqueued only on pages that render a Group or Navigation block.

## Development

```bash
npm install
composer install     # also copies Plugin Update Checker into lib/ via the copy-puc script
```

```bash
npm start            # webpack watch
npm run build        # production build into build/
npm run lint:js      # ESLint via @wordpress/scripts
npm run lint:css     # Stylelint
npm run lint:php     # phpcs, WordPress Coding Standards (composer lint:php)
npm run lint:php:fix # phpcbf
composer analyse     # PHPStan
```

Tests:

```bash
npm run test:unit    # Jest: src/__tests__/ (save-element transform and link sanitizers)
npm run env:start    # wp-env (Docker), needed for the two suites below
npm run test:php     # PHPUnit inside wp-env, tests/phpunit/
npm run test:e2e     # Playwright against the wp-env tests site, tests/e2e/
npm run env:stop
```

CI (`.github/workflows/ci.yml`) runs `composer audit`, phpcs, and PHPStan on PHP 8.0 through 8.4; lints, builds, and runs the Jest tests on Node 22; and starts wp-env to run the Playwright and PHPUnit suites.

## Releases

Bump the version in `group-block-extended.php` (header and `GROUP_BLOCK_EXTENDED_VERSION`), `package.json`, and the `Stable tag` in `readme.txt`, add the changelog entry to `readme.txt`, then push a `v` tag:

```bash
git tag v1.3.1 && git push origin v1.3.1
```

The release workflow (`.github/workflows/release.yml`) runs `npm ci`, builds, runs `npm run plugin-zip`, pulls the matching `= X.Y.Z =` section out of `readme.txt` as the release notes, and attaches `group-block-extended.zip` and `readme.txt` to the GitHub release. Use a lowercase `v`: Plugin Update Checker strips the prefix case-sensitively.

## Limitations

- Deactivating the plugin leaves blocks with a link or aspect ratio set showing a validation error, because the saved HTML no longer matches core's save output. Remove those attributes first.
- Link to post has no effect outside a Query Loop or a block registered through `groupBlockExtended.queryBlocks`.
- Nested linked groups are not supported.

## License

GPL-2.0-or-later. See [LICENSE](https://www.gnu.org/licenses/gpl-2.0.html).
