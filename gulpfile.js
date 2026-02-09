const { src, dest, parallel, series, watch } = require('gulp')
const del = require('del')
const fs = require('fs')
const path = require('path')
const sass = require('gulp-sass')(require('sass'))
const merge = require('merge-stream')
const hb = require('gulp-hb')
const rename = require('gulp-rename')
const directoryTree = require('directory-tree')
const browserSync = require('browser-sync')
const server = browserSync.create()


// Build and Template Setup
// ------------------------

function clean () {
	return del([
    'build/**/*',
  ])
}

function reload (done) {
  server.reload()
  done()
}

function serve (done) {
  server.init({
    server: {
      baseDir: '.'
    }
  })
  done()
}

function watcher () {
	watch('theme/scss/**/*.scss', series(css, reload))
	watch('theme/**/*.{hbs,html}', series(html, reload))
	watch('theme/*.{hbs,html}', series(html, reload))
	// watch('theme/fonts/**/*', series(fonts, reload))
	// watch('images/**/*.{gif,jpg,png,svg}', series(images, reload))
	watch('presentations/**/slides/**/*.{html,md}', series(html, reload))
	watch('presentations/**/config.js', series(html, indexHtml, reload))
}


// Tidy template
// -------------

// function images () {
// 	return src('./images/**/*')
// 		.pipe(dest('./build/images'))
// }

// function fonts () {
// 	return src('./theme/fonts/**/*')
// 		.pipe(dest('./build/fonts'))
// }

function css () {
	return src('./theme/scss/*.scss')
		.pipe(sass().on('error', sass.logError))
		.pipe(dest('./assets/css'))
}

function html (done) {
	const presentations = getPresentations()

	if (presentations.length === 0) {
		console.log('No presentations found in ./presentations/')
		done()
		return
	}

	const streams = presentations.map(presentationName => {
		const presentationPath = `./presentations/${presentationName}`
		const slidesPath = `${presentationPath}/slides`
		const configPath = path.resolve(presentationPath, 'config.js')

		// Load presentation-specific config
		let config = {}
		if (fs.existsSync(configPath)) {
			// Clear require cache to get fresh config
			delete require.cache[require.resolve(configPath)]
			config = require(configPath)
		}

		const slides = _findSlides(presentationPath, slidesPath)
		const data = Object.assign({}, config, { slides: slides })

		const hbstream = hb()
			.helpers({
				loadHTML: function (file) { return fs.readFileSync(file) }
			})
			.partials('./theme/partials/*.hbs')
			.data(data)

		return src('./theme/*.hbs')
			.pipe(hbstream)
			.pipe(rename({ extname: '.html' }))
			.pipe(dest(presentationPath))
	})

	return merge(...streams)
}

// function markdown () {
// 	return src('./slides/**/*.md')
// 		.pipe(dest('./build/slides'))
// }

// function prism () {
// 	return src('./vendor/**/*')
// 		.pipe(dest('./build/vendor'))
// }


// Reveal.js Library
// -----------------

function reveal () {
	return merge(
		src('./node_modules/reveal.js/css/**/*.css')
			.pipe(dest('./assets/vendor/revealjs/css')),

		src('./node_modules/reveal.js/js/reveal.js')
			.pipe(dest('./assets/vendor/revealjs')),

		src('./node_modules/reveal.js/lib/**')
			.pipe(dest('./assets/vendor/revealjs/lib')),

		src('./node_modules/reveal.js/plugin/**')
			.pipe(dest('./assets/vendor/revealjs/plugin'))
	)
}

// function init () {
// 	return src('./reveal.init.js')
// 		.pipe(rename('init.js'))
// 		.pipe(dest('./build/'))
// }


// Helpers
// -------

function getPresentations () {
	const presentationsDir = './presentations'
	if (!fs.existsSync(presentationsDir)) {
		return []
	}
	return fs.readdirSync(presentationsDir).filter(name => {
		const fullPath = path.join(presentationsDir, name)
		return fs.statSync(fullPath).isDirectory()
	})
}

function indexHtml () {
	const presentations = getPresentations().map(name => {
		const configPath = path.resolve(`./presentations/${name}`, 'config.js')
		let config = { title: name }
		if (fs.existsSync(configPath)) {
			delete require.cache[require.resolve(configPath)]
			config = require(configPath)
		}
		return { name, ...config }
	})

	const links = presentations.filter(p => (p.title || p.name).startsWith('#')).map(p => {
		const desc = p.description ? '<p>' + p.description + '</p>' : ''
		return '<a href="presentations/' + p.name + '/index.html"><h2>' + (p.title || p.name) + '</h2>' + desc + '</a>'
	}).join('\n\t')

	const html = `<!DOCTYPE html>
<html lang="de">
<head>
	<meta charset="UTF-8">
	<title>Präsentationen</title>
	<style>
		body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
		a { display: block; padding: 1rem; margin: 0.5rem 0; background: #f5f5f5; text-decoration: none; color: #333; border-radius: 4px; }
		a:hover { background: #e0e0e0; }
		h2 { margin: 0; }
		p { margin: 0.25rem 0 0; color: #666; font-size: 0.9rem; }
	</style>
</head>
<body>
	<h1>Präsentationen</h1>
	${links}
</body>
</html>`

	fs.writeFileSync('./index.html', html)
	return Promise.resolve()
}

function _findSlides (presentationPath, slidesPath, tree) {
	let filtered = []

	if (tree === undefined) {
		const dirTree = directoryTree(slidesPath)
		tree = dirTree ? dirTree.children : []
	}

	tree.forEach(function (child, i) {
		// Convert path to relative path from presentation folder (for browser URLs)
		const relativePath = path.relative(presentationPath, child.path)

		if (child.type === 'directory') {
			filtered.push({
				folder: relativePath,
				slides: _findSlides(presentationPath, slidesPath, child.children)
			})
		}
		else if (child.extension === '.html') {
			// HTML files are loaded at build time via loadHTML helper
			// Keep the original path for fs.readFileSync
			filtered.push({
				type: 'html',
				content: child.path
			})
		}
		else if (child.extension === '.md') {
			// Markdown files are loaded by browser via data-markdown
			// Use relative path from presentation folder
			filtered.push({
				type: 'markdown',
				content: relativePath
			})
		}
	})
	return filtered
}


// Public Gulp Tasks
// -----------------

function build (done) {
	return series(
		clean,
		parallel(
			css,
			html,
			indexHtml,
			// fonts,
			// images,
			// markdown,
			reveal,
			// prism
		)//,
		// init
	)(done)
}


// Exports
// -------

exports.default = build
exports.build = build
exports.dev = series(build, serve, watcher)
exports.serve = series(build, serve)
