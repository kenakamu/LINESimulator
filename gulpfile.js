var gulp = require('gulp');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var plumber = require('gulp-plumber');
var cache = require('gulp-cached');
var concat = require('gulp-concat');

var reporter = ts.reporter.fullReporter();

var packager = require('electron-packager')
var electronInstaller = require('electron-winstaller');

gulp.task('typescript', () => {
    var project = ts.createProject('./tsconfig.json');
    var tsResult = project.src()
        .pipe(sourcemaps.init())
        .pipe(project(reporter));

    return tsResult.js
        .pipe(plumber())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./dist'));
});

gulp.task('typescript-main', function () {
    var project = ts.createProject('./tsconfig.json');
    return gulp.src(['src/main.ts', 'src/models/*.ts'])
        .pipe(sourcemaps.init())
        .pipe(project(reporter), { referencedFrom: ['main.ts'] })
        .js
        .pipe(plumber())
        .pipe(concat("main.js"))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./dist'));
});

gulp.task('copy-css', () => {
    gulp.watch('./src/css/*');
    return gulp.src('./src/css/*')
        .pipe(cache('css'))
        .pipe(gulp.dest('./dist/css'));
});
gulp.task('copy-html', () => {
    return gulp.src('./src/html/*')
        .pipe(cache('html'))
        .pipe(gulp.dest('./dist/html'));
});
gulp.task('copy-img', () => {
    return gulp.src('./src/img/*')
        .pipe(cache('img'))
        .pipe(gulp.dest('./dist/img'));
});
gulp.task('copy-model', () => {
    return gulp.src('./src/models/*')
        .pipe(cache('models'))
        .pipe(gulp.dest('./dist/models'));
});
gulp.task('copy-temp', () => {
    return gulp.src('./src/temp')
        .pipe(gulp.dest('./dist/temp'));
});

gulp.task('copy', ['copy-css', 'copy-html', 'copy-img', 'copy-model', 'copy-temp']);

gulp.task('watch', () => {
    gulp.watch('./src/**/*.ts', ['typescript']);
    gulp.watch('./src/main.ts', ['typescript-main']);
    gulp.watch('./src/**/*', ['copy']);
});

gulp.task('default', ['typescript', 'typescript-main', 'copy', 'watch']);

gulp.task('win-packager', function (done) {
    return packager({
        dir: './',
        out: './release-builds',
        name: 'LineSimulator',
        arch: 'x64',
        platform: 'win32',
        electronVersion: '2.0.5',
        overwrite: true,
        icon: './src/icons/favicon.ico'
    });
});

gulp.task('win-installer', function () {
    return electronInstaller.createWindowsInstaller({
        appDirectory: './release-builds/LineSimulator-win32-x64',
        outputDirectory: './release-builds/win-installer',
        description: 'LINE Simulator',
        authors: 'kenakamu',
        exe: 'LineSimulator.exe',
        loadingGif:'./installer.gif'
    });
});
