# @jet-w/astro-blog-cli

CLI tool for creating Astro blogs with [@jet-w/astro-blog](https://github.com/jet-w/astro-blog) theme.

## Quick Start

```bash
# Create a new blog project
npx create-astro-blog my-blog

# Or use npm create
npm create astro-blog my-blog
```

## Installation

```bash
# Global installation
npm install -g @jet-w/astro-blog-cli

# Then use
astro-blog create my-blog
```

## Usage

### Interactive Mode

Run without options to enter interactive mode:

```bash
npx create-astro-blog
```

You will be prompted for:
- Project name
- Blog title (English & Chinese)
- Blog description (English & Chinese)
- Author name
- Author email
- Site URL
- Template selection

### Non-Interactive Mode

Use `-y` flag to skip prompts and use defaults or provided options:

```bash
# Quick create with defaults
npx create-astro-blog my-blog -y

# With custom options
npx create-astro-blog my-blog -y \
  --title "My Awesome Blog" \
  --title-zh "我的博客" \
  --description "A blog about tech" \
  --description-zh "一个关于技术的博客" \
  --author "John Doe" \
  --email "john@example.com" \
  --site "https://myblog.com"
```

## Commands

### `create [project-name]`

Create a new Astro blog project.

```bash
astro-blog create my-blog
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `-t, --template <template>` | Template to use | `default` |
| `--title <title>` | Blog title (English) | `My Astro Blog` |
| `--title-zh <titleZh>` | Blog title (Chinese) | `我的Astro博客` |
| `--description <description>` | Blog description (English) | - |
| `--description-zh <descriptionZh>` | Blog description (Chinese) | - |
| `--author <author>` | Author name | `Author` |
| `--email <email>` | Author email | `email@example.com` |
| `--site <site>` | Site URL | `https://example.com` |
| `--lang <lang>` | CLI language (`en`/`zh`) | Auto-detect |
| `-y, --yes` | Skip prompts, use defaults | - |
| `-f, --force` | Overwrite existing directory | - |

### `init`

Initialize an existing project with @jet-w/astro-blog dependency.

```bash
cd existing-project
astro-blog init
```

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--lang <lang>` | CLI language (`en`/`zh`) | Auto-detect |

## Examples

### Create a blog with all options

```bash
npx create-astro-blog my-tech-blog -y \
  --title "Tech Notes" \
  --title-zh "技术笔记" \
  --description "Personal tech blog" \
  --description-zh "个人技术博客" \
  --author "Jane Smith" \
  --email "jane@example.com" \
  --site "https://jane-tech.com"
```

### Create with Chinese CLI interface

```bash
npx create-astro-blog my-blog --lang zh
```

### Force overwrite existing directory

```bash
npx create-astro-blog my-blog -y -f
```

## After Creation

```bash
cd my-blog
npm install
npm run dev
```

Your blog will be running at `http://localhost:4321`.

## Project Structure

The created project includes:

```
my-blog/
├── astro.config.mjs        # Astro configuration
├── package.json
├── src/
│   ├── config/
│   │   ├── site.ts         # Main site configuration
│   │   └── locales/        # i18n configurations
│   │       ├── en/         # English locale
│   │       └── zh-CN/      # Chinese locale
│   └── content.config.ts   # Content collections schema
├── content/
│   ├── posts/              # Blog posts (Markdown/MDX)
│   ├── pages/              # Static pages
│   └── slides/             # Presentation slides
└── public/                 # Static assets
```

## Features

- Multi-language support (i18n)
- Markdown & MDX support
- Code syntax highlighting
- Mermaid diagrams
- LaTeX math equations
- Custom containers (tip, warning, danger, etc.)
- RSS feed
- Tailwind CSS styling
- Vue.js components support

## Documentation

For more information about the blog theme, visit:
- [GitHub Repository](https://github.com/jet-w/astro-blog)

## License

MIT
