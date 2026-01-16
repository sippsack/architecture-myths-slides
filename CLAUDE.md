# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a reveal.js-based presentation system (tidy-revealjs) that supports multiple presentations. Each presentation lives in its own folder under `presentations/` with its slides and configuration. The build system uses Gulp to compile templates and SCSS.

## Commands

- `npm run dev` - Start development server with live-reload at http://localhost:3000
- `npm run build` - Build all presentations (compiles SCSS, processes Handlebars templates, copies reveal.js assets)
- `npm start` - Build and serve without watch mode

Press `s` during presentation to open speaker notes.

## Architecture

**Project Structure:**
```
/presentations/<name>/slides/     -> Slide files (.md, .html)
/presentations/<name>/config.js   -> Presentation config (title, description, author)
/presentations/<name>/index.html  -> Generated output
/theme/                           -> Shared templates and SCSS
/assets/                          -> Compiled CSS and reveal.js (shared)
```

**Build Pipeline (gulpfile.js):**
- Scans `presentations/` directory for all presentations
- For each presentation:
  - Loads `config.js` for title, description, author
  - Scans `slides/` directory recursively using `directory-tree`
  - Processes Handlebars template (`theme/index.hbs`) with slide data
  - Outputs `index.html` to `presentations/<name>/`
- Compiles SCSS from `theme/scss/` to `assets/css/`

**Slide Organization:**
- Files in `slides/` are loaded alphabetically - use numeric prefixes (10-, 20-, 30-) to control order
- Subdirectories become vertical slide stacks (reveal.js vertical navigation)
- `.md` files are rendered as markdown slides
- `.html` files must have `<section>` as root element

**Configuration:**
- Each presentation has its own `config.js` with variables available in Handlebars templates (title, description, author)

**Theming:**
- SCSS partials in `theme/scss/` - `styles.scss` is the entry point
- Custom fonts in `theme/fonts/`
- Handlebars partials in `theme/partials/` handle slide type rendering
- Assets are shared across all presentations via relative paths (`../../assets/`)

## Creating a New Presentation

1. Create folder: `presentations/<name>/`
2. Create `presentations/<name>/config.js` with title, description, author
3. Create `presentations/<name>/slides/` directory
4. Add slide files (.md or .html) to the slides directory
5. Run `npm run build` - index.html will be generated
6. Access at `http://localhost:3000/presentations/<name>/index.html`
