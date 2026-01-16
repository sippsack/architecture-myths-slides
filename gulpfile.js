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
	watch('presentations/**/config.js', series(html, reload))
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
