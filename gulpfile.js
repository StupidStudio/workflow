// Gulp
var gulp = require('gulp'),
	gutil = require('gulp-util'),
	sass = require('gulp-ruby-sass'),
	jshint = require('gulp-jshint'),
	stylish = require('jshint-stylish'),
	compass = require('gulp-compass'),
	uglify = require('gulp-uglifyjs'),
	concat = require('gulp-concat'),
	autoprefixer = require('gulp-autoprefixer'),
	minifyCss = require('gulp-minify-css'),
	clean = require('gulp-clean'),
	livereload = require('gulp-livereload'),
	sourcemaps = require('gulp-sourcemaps'),
	cmq = require('gulp-combine-media-queries');

// Others
var fs = require('fs'),
	_ = require('lodash');

// Settings
var settings = {
	build: './_',
	source: 'src'
};

var bowerJson = (JSON.parse(fs.readFileSync('bower.json', "utf8"))) || false;
var bowerPath = (JSON.parse(fs.readFileSync('.bowerrc', "utf8"))).directory + '/' || 'bower_components/';

// Lint js files
gulp.task('lint', function () {
	'use strict';

	gulp.src(settings.source + '/js/*.js')
		.pipe(jshint())
		.pipe(jshint.reporter(stylish));
});

// Minify js files
gulp.task('js', function () {
	'use strict';
	gulp.src([settings.source + '/js/**/*.js'])
		.pipe(uglify('main.min.js', {
			outSourceMap: true
		}))
		.pipe(gulp.dest(settings.build + '/js'));
});

// Minify libs
gulp.task('lib', function () {

	gulp.src([settings.source + '/lib/**/*.js'])
		.pipe(uglify('lib.min.js'))
		.pipe(gulp.dest(settings.build + '/js')); 

})

// Minify Vendor (Bower)
gulp.task('vendor', function () {
	gulp.src(bowerFiles())
		.pipe(uglify('vendor.min.js'))
		.pipe(gulp.dest(settings.build + '/js'));
})

// Compile vendor css and scss
gulp.task('css', function () {
	'use strict';

	gulp.src(settings.source + '/scss/*.scss')
//		.pipe(sass({
//			style: 'compressed'
//		}))
	.pipe(compass({
		config_file: './config.rb',
		css: './_/css',
		sass: './src/scss'
	  }))
	.on('error', gutil.log)
	.pipe(autoprefixer('last 1 version', 'ie 9', 'ios 7'))
	.pipe(cmq({
		log: true
	}))
	.pipe(minifyCss())
	//.pipe(concat('style.min.css'))
	.pipe(gulp.dest(settings.build + '/css'));

});


// Default task and watch files
gulp.task('default', ['build'], function () {
	'use strict';
	livereload.listen();

	gulp.watch([settings.source + '/scss/**/*.scss'], ['css']);
	gulp.watch([settings.source + '/js/*.js'], ['js']);
	gulp.watch([settings.source + '/lib/**/*.js'], ['lib']);
	gulp.watch([settings.source + '/vendor/**/*.js'], ['vendor']);

	gulp.watch([settings.build + '/**/*.css', 
				settings.build + '/**/*.js', 
				settings.build + '/view/**/*.php',
				settings.build + '/components/**/*.php',
				settings.build + '/wp/**/*.php',
				'*.php', 
				'*.html']).on('change', livereload.changed);

});

gulp.task('build', ['css', 'js', 'lib', 'vendor']);

gulp.task('build-vendor', ['vendor', 'lib']);


function bowerFiles() {
	if (!bowerJson) return "";

	var dependencies = [];
	
	for (var name in bowerJson.devDependencies) {
		/*
		 * Check if is in exclude
		 * Do it in bower.json
		 */
		if(_.filter(bowerJson.exclude, function(el){ return el.package == undefined || el.package != name ? false : true; }).length){
			continue;	
		} 
		
		/*
		 * Get JS files
		 */
		var devBowerJsonPath = bowerPath + name + '/';
		var devBowerJson;
		
		try{
			devBowerJson = (JSON.parse(fs.readFileSync(devBowerJsonPath + 'bower.json', "utf8")));
		}catch (err){
			devBowerJson = (JSON.parse(fs.readFileSync(devBowerJsonPath + 'package.json', "utf8")));	
		}
		
		if (typeof (devBowerJson.main) == "string") {

			var string = devBowerJson.main.replace(/\.\//gi, '');
			if (string.match(/.js/)) dependencies.push(devBowerJsonPath + string);

		} else {
			_.each(devBowerJson.main, function (el, i) {
				if (el.match(/.js/)) dependencies.push(devBowerJsonPath + el);
			})
		}

	}


	return dependencies.length ? dependencies : "";

}