# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a reveal.js-based presentation system (tidy-revealjs) that automatically generates slides from markdown and HTML files in the `slides/` directory. The build system uses Gulp to compile templates and SCSS.

## Commands

- `npm run dev` - Start development server with live-reload at http://localhost:3000
- `npm run build` - Build the presentation (compiles SCSS, processes Handlebars templates, copies reveal.js assets)
- `npm start` - Build and serve without watch mode

Press `s` during presentation to open speaker notes.

## Architecture

**Build Pipeline (gulpfile.js):**
- Scans `slides/` directory recursively using `directory-tree`
- Processes Handlebars template (`theme/index.hbs`) with slide data
- Compiles SCSS from `theme/scss/` to `assets/css/`
- Outputs `index.html` to project root

**Slide Organization:**
- Files in `slides/` are loaded alphabetically - use numeric prefixes (10-, 20-, 30-) to control order
- Subdirectories become vertical slide stacks (reveal.js vertical navigation)
- `.md` files are rendered as markdown slides
- `.html` files must have `<section>` as root element

**Configuration:**
- `slides.config.js` - Variables available in Handlebars templates (title, description, author)

**Theming:**
- SCSS partials in `theme/scss/` - `styles.scss` is the entry point
- Custom fonts in `theme/fonts/`
- Handlebars partials in `theme/partials/` handle slide type rendering