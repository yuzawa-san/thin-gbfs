// loads various gulp modules
var gulp = require('gulp');
var concat = require('gulp-concat');
var minifyCSS = require('gulp-clean-css');
var embed = require('gulp-image-embed');
var webpack = require('webpack');
var gulpWebpack = require('webpack-stream');

// create task
gulp.task("default", ["css","js"]);

gulp.task('css', function(){
    gulp.src(['src/css/**/*.css','node_modules/leaflet/dist/*.css'])
        .pipe(embed({}))
        .pipe(minifyCSS({rebase: false}))
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest('dist'))
    gulp.src('node_modules/leaflet/dist/images/*')
        .pipe(gulp.dest('dist/images'))
    gulp.src('src/img/*')
        .pipe(gulp.dest('dist/images'))
});

gulp.task('js', function(){
    // modify some webpack config options
    var webpackConfig = require('./webpack.config.js')
    webpackConfig.plugins = [
    new webpack.DefinePlugin({
        "process.env": {
            // This has effect on the react lib size
            "NODE_ENV": JSON.stringify("production")
        }
    }), new webpack.optimize.UglifyJsPlugin()];

    // run webpack
    return gulp.src('src/js/main.js')
      .pipe(gulpWebpack( webpackConfig ))
      .pipe(gulp.dest('dist'));
});