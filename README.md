# Group Block Extended

A WordPress plugin that extends the core Group block with aspect ratio control, linked groups, hover colors, overlay, height control, a space-around justification option, and admin-configurable defaults for new groups.

## Features

### Aspect Ratio
Set a fixed aspect ratio on any Group block. Choose from common presets or enter a custom value. The ratio is applied as an inline `aspect-ratio` style both in the editor canvas and in saved HTML.

Presets: `1:1`, `5:4`, `4:3`, `3:2`, `16:9`, `4:5`, `3:4`, `2:3`, `9:16`, or custom.

### Linked Group
Turn any Group block into a clickable linked region.

**Static link** — enter a URL in the inspector panel. The group is wrapped in an `<a class="wp-block-group-link">` tag in saved HTML. Supports:
- Open in new tab
- Custom `rel` attribute
- `aria-label`
- `title`

**Link to post** — available inside a Query Loop. Links to the current post's permalink via a PHP render filter, keeping the URL out of saved HTML so it stays current automatically. The `aria-label` defaults to the post title.

Both modes automatically convert any nested `<a>` tags to `<span>` to keep the HTML valid.

### Hover Colors
Apply color changes on hover. Set hover values for text, background, and links independently. Changes are previewed live in the editor canvas.

### Overlay
Add a color overlay that sits behind the group's content — above the background but below text and nested blocks, matching the behavior of the core Cover block.

Configure a default opacity and a separate hover opacity (and optionally a different hover color) to create smooth CSS transitions between states. Common use cases:
- Always-visible tint that darkens on hover
- No overlay at rest that reveals a color on hover
- Color shift on hover (e.g. blue → red)

Hover colors and the overlay also respond to keyboard focus on linked groups.

### Justification and Height
Group and Navigation blocks with a flex layout get a fifth justification option, **Space around**. Group blocks also get a **Height** control next to Min. Height in the Dimensions panel.

### Defaults for New Groups
**Settings → Group Block Extended** lets you set a default alignment and turn off "Inner blocks use content width" for new Group blocks. The same defaults are available as filters: `group_block_extended_default_alignment` and `group_block_extended_disable_content_width`.

## Installation

Download the latest release zip and install via **Plugins → Add New → Upload Plugin**, or unzip into `wp-content/plugins/group-block-extended/`.

## Development

```bash
npm install
npm run build        # production build
npm run start        # watch mode
```

### Linting

```bash
npm run lint:js      # ESLint via @wordpress/scripts
npm run lint:css     # Stylelint
npm run lint:php     # PHPCS with WordPress Coding Standards
npm run lint:php:fix # Auto-fix PHPCS violations
composer analyse     # PHPStan
```

### Testing

```bash
npm run test:unit    # Jest — save-element transform and link sanitizers
npm run env:start    # wp-env (Docker) for the suites below
npm run test:php     # PHPUnit integration tests inside wp-env
npm run test:e2e     # Playwright editor tests against the wp-env tests site
```

### Packaging

```bash
npm run plugin-zip   # creates group-block-extended.zip
```

## License

GPL-2.0-or-later — see [LICENSE](https://www.gnu.org/licenses/gpl-2.0.html).
