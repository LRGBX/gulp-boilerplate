/**
 * Gulp Packages
 */

// General
const {src, dest, watch, series, parallel} = require('gulp');
const del = require('del');
const flatmap = require('gulp-flatmap');
const lazypipe = require('lazypipe');
const rename = require('gulp-rename');
const header = require('gulp-header');
const package = require('./package.json');

// Scripts
const babel = require('gulp-babel');
const jshint = require('gulp-jshint');
const stylish = require('jshint-stylish');
const concat = require('gulp-concat');
const uglify = require('gulp-terser');
const optimizejs = require('gulp-optimize-js');

// Styles
const sass = require('gulp-sass');
const prefix = require('gulp-autoprefixer');
const minify = require('gulp-cssnano');

// SVGs
const svgmin = require('gulp-svgmin');

// BrowserSync
const browserSync = require('browser-sync');


/**
 * Settings
 * Turn on/off build features
 */

var settings = {
	clean: true,
	scripts: true,
	polyfills: false,
	styles: true,
	svgs: true,
	copy: true,
	reload: true
};


/**
 * Paths to project folders
 */

var paths = {
	input: 'src/',
	output: 'dist/',
	scripts: {
		input: ['src/js/*'],
		polyfills: '.polyfill.js',
		output: 'dist/js/'
	},
	styles: {
		input: 'src/sass/**/*.{scss,sass}',
		output: 'dist/css/'
	},
	svgs: {
		input: 'src/svg/*.svg',
		output: 'dist/svg/'
	},
	copy: {
		input: 'src/copy/**/*',
		output: 'dist/'
	},
	reload: './dist/'
};


/**
 * Template for banner to add to file headers
 */

// var banner = {
// 	full:
// 		'/*!\n' +
// 		' * <%= package.name %> v<%= package.version %>\n' +
// 		' * <%= package.description %>\n' +
// 		' * (c) ' + new Date().getFullYear() + ' <%= package.author.name %>\n' +
// 		' * <%= package.license %> License\n' +
// 		' * <%= package.repository.url %>\n' +
// 		' */\n\n',
// 	min:
// 		'/*!' +
// 		' <%= package.name %> v<%= package.version %>' +
// 		' | (c) ' + new Date().getFullYear() + ' <%= package.author.name %>' +
// 		' | <%= package.license %> License' +
// 		' | <%= package.repository.url %>' +
// 		' */\n'
// };


/**
 * Gulp Tasks
 */

var cleanDist = function (done) {
	if (!settings.clean) return done();
	del.sync([
		paths.output
	]);
	return done();
};

var jsTasks = lazypipe()
	// .pipe(header, banner.full, {package: package})
	.pipe(babel, {presets: ['@babel/preset-env']})
	.pipe(optimizejs)
	.pipe(dest, paths.scripts.output)
	.pipe(rename, {suffix: '.min'})
	.pipe(uglify)
	.pipe(optimizejs)
	// .pipe(header, banner.min, {package: package})
	.pipe(dest, paths.scripts.output);

var buildScripts = function (done) {
	if (!settings.scripts) return done();
	return src(paths.scripts.input)
		.pipe(flatmap(function(stream, file) {
			if (file.isDirectory()) {
				var suffix = '';
				if (settings.polyfills) {
					suffix = '.polyfills';
					src([file.path + '/*.js', '!' + file.path + '/*' + paths.scripts.polyfills])
						.pipe(concat(file.relative + '.js'))
						.pipe(jsTasks());
				}
				src(file.path + '/*.js')
					.pipe(concat(file.relative + suffix + '.js'))
					.pipe(jsTasks());
				return stream;
			}
			return stream.pipe(jsTasks());
		}));
};

// Lint scripts
var lintScripts = function (done) {
	if (!settings.scripts) return done();
	return src(paths.scripts.input)
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'));
};

// Process, lint, and minify Sass files
var buildStyles = function (done) {
	if (!settings.styles) return done();
	return src(paths.styles.input)
		.pipe(sass({
			outputStyle: 'expanded',
			sourceComments: true
		}))
		.pipe(prefix({
			cascade: true,
			remove: true
		}))
		// .pipe(header(banner.full, { package : package }))
		.pipe(dest(paths.styles.output))
		.pipe(rename({suffix: '.min'}))
		.pipe(minify({
			discardComments: {
				removeAll: true
			}
		}))
		// .pipe(header(banner.min, { package : package }))
		.pipe(dest(paths.styles.output));
};

// Optimize SVG files
var buildSVGs = function (done) {
	if (!settings.svgs) return done();
	return src(paths.svgs.input)
		.pipe(svgmin())
		.pipe(dest(paths.svgs.output));
};

var copyFiles = function (done) {
	if (!settings.copy) return done();
	return src(paths.copy.input)
		.pipe(dest(paths.copy.output));
};

var startServer = function (done) {
	if (!settings.reload) return done();
	browserSync.init({
		server: {
			baseDir: paths.reload
		}
	});
	done();
};

var reloadBrowser = function (done) {
	if (!settings.reload) return done();
	browserSync.reload();
	done();
};

var watchSource = function (done) {
	watch(paths.input, series(exports.default, reloadBrowser));
	done();
};


/**
 * Export Tasks
 */

exports.default = series(
	cleanDist,
	parallel(
		buildScripts,
		lintScripts,
		buildStyles,
		buildSVGs,
		copyFiles
	)
);

exports.watch = series(
	exports.default,
	startServer,
	watchSource
);