// loads various gulp modules
var gulp = require('gulp');
var concat = require('gulp-concat');
var minifyCSS = require('gulp-clean-css');
var embed = require('gulp-image-embed');
var webpack = require('webpack');
var gulpWebpack = require('webpack-stream');
var hash = require('gulp-hash-filename');
var clean = require('gulp-clean');
var htmlReplace = require('gulp-html-replace');
var htmlmin = require("gulp-htmlmin");
var filenames = require("gulp-filenames");

// create task
gulp.task("default", ["html"]);

gulp.task('css', function() {
    gulp.src('dist/bundle*.css', {
            read: false
        })
        .pipe(clean())
    gulp.src(['src/css/*.css', 'node_modules/leaflet/dist/*.css'])
        .pipe(embed({
            extension: ['jpg', 'png', 'svg']
        }))
        .pipe(minifyCSS({
            rebase: false
        }))
        .pipe(concat('bundle.css'))
        .pipe(hash())
        .pipe(filenames("css"))
        .pipe(gulp.dest('dist'))
    gulp.src('node_modules/leaflet/dist/images/*')
        .pipe(gulp.dest('dist/images'))
    gulp.src('src/img/*')
        .pipe(gulp.dest('dist/images'))
});

gulp.task('js', function() {
    gulp.src('dist/bundle*.js', {
            read: false
        })
        .pipe(clean())

    // modify some webpack config options
    var webpackConfig = require('./webpack.config.js')
    webpackConfig.plugins = [
        new webpack.DefinePlugin({
            "process.env": {
                // This has effect on the react lib size
                "NODE_ENV": JSON.stringify("production")
            }
        }), new webpack.optimize.UglifyJsPlugin()
    ];

    // run webpack
    return gulpWebpack(webpackConfig)
        .pipe(gulp.dest('dist')).pipe(filenames("js"))
        .pipe(hash())
        .pipe(gulp.dest('dist')).pipe(filenames("js"));
});

gulp.task('html', ["css", "js"], function() {
    return gulp.src('src/html/index.html')
        .pipe(htmlReplace({
            'css': {
                src: filenames.get("css"),
                tpl: '<link href="dist/%s" rel="stylesheet" type="text/css">'
            },
            'js': {
                src: filenames.get("js"),
                tpl: '<script src="dist/%s"></script>'
            }
        }))
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        .pipe(gulp.dest('dist'));
});
