var gulp 			= require('gulp');
var concat 			= require('gulp-concat');
var watch 			= require('gulp-watch');
var htmlv 			= require('gulp-html-validator');
var htmlhint 		= require("gulp-htmlhint");
var mainBowerFiles 	= require('gulp-main-bower-files');
var gulpFilter 		= require('gulp-filter');
var uglify 			= require('gulp-uglify')
var sourcemaps 		= require('gulp-sourcemaps');

gulp.task('concat', function() {
  return gulp.src(['./public/js/**/*.js', './public/toolbar/*.js'])
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./public/'));
});


var dirs = ['./public/app/**/*.js'] 
gulp.task('auto-concat', function(cb){
	watch(dirs, function(){
		console.log(new Date());

		gulp.src(dirs)
		.pipe(concat('bundle.js'))
	    .pipe(gulp.dest('./public/'));

	})
});


var t = {
	overrides: {
		forge: {
			main: [
				'./js/forge.bundle.js'
				]
			}
		}
	}


gulp.task('vendor-concat', function(){
    var filter = gulpFilter('**/*.js');



	return gulp.src('./bower.json')
		.pipe(mainBowerFiles(t))
		.pipe(filter)
		.pipe(sourcemaps.init())
			.pipe(concat('vendor.js'))
		.pipe(sourcemaps.write())
		//.pipe(uglify())
		.pipe(gulp.dest('./public/'))
});



gulp.task('validate', function(){
	return gulp.src(['./public/app/**/*.html'])
	.pipe(htmlhint())
  	.pipe(htmlhint.reporter("htmlhint-stylish"))
})








gulp.task('default', ['concat', 'validate']);