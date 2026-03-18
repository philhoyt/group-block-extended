# Group Block Extended

A WordPress plugin that extends the core Group block with aspect ratio control, linked group functionality, hover color effects, and overlay support.

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
npm run lint:php     # PHPCS with WordPress Coding Standards
npm run lint:php:fix # Auto-fix PHPCS violations
```

### Packaging

```bash
npm run plugin-zip   # creates group-block-extended.zip
```

## License

GPL-2.0-or-later — see [LICENSE](https://www.gnu.org/licenses/gpl-2.0.html).
