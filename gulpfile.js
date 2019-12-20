const {src, dest, watch, parallel, series} = require('gulp');
const connect = require('gulp-connect'); //启动本地服务
const open = require("open"); //打开浏览器
const del = require('del'); //删除文件及文件夹
const sass = require('gulp-sass'); //sass、scss编译
const ts = require('gulp-typescript'); //编译ts

const rev = require("gulp-rev"); //文件版本号
const revCollector = require("gulp-rev-collector"); //文件版本号映射
const uglify = require("gulp-uglify");     //js文件压缩
const cssmin = require("gulp-cssmin");     //css压缩
const htmlMin = require("gulp-htmlmin");   //html文件压缩

const app = {
    srcPath: 'src/',        //项目根目录
    buildPath: 'dist/',     //发布模式根目录
    devPath: 'dev/',        //开发模式根目录
    revPath: 'rev/'         //版本号根目录
};

let html_min_options = {
    collapseWhitespace: true,                //压缩HTML
    collapseBooleanAttributes: true,         //省略布尔属性的值
    removeComments: true,                    //清除HTML注释
    removeEmptyAttributes: true,             //删除所有空格作属性值
    removeScriptTypeAttributes: true,        //删除<script>的type="text/javascript"
    removeStyleLinkTypeAttributes: true,     //删除<style>和<link>的type="text/css"
    minifyJS: true,                          //压缩页面JS
    minifyCSS: true                          //压缩页面CSS
};

function clean(cb) {
    return del([app.devPath, app.buildPath, app.revPath], cb)
}

/*--------开发模式-DEV-START--------*/
function image() {
    return src(app.srcPath + 'images/**/*')
        .pipe(dest(app.devPath + 'images'))
        .pipe(connect.reload());
}

function css() {
    return src(app.srcPath + 'scss/**/*.scss')
        .pipe(sass())
        .pipe(dest(app.devPath + 'css'))
        .pipe(connect.reload());
}

function tsc() {
    return src(app.srcPath + 'ts/**/*.ts')
        .pipe(ts())
        .pipe(dest(app.srcPath + 'js'));
}

function js() {
    return src(app.srcPath + 'js/**/*.js')
        .pipe(dest(app.devPath + 'js'))
        .pipe(connect.reload());
}

function html() {
    return src(app.srcPath + '**/*.html')
        .pipe(dest(app.devPath))
        .pipe(connect.reload());
}

function server(cb) {
    /*设置服务器*/
    connect.server({
        root: [app.devPath],    //要运行哪个目录
        livereload: true,       //是否热更新
        port: 5000              //端口号
    })
    open("http://localhost:5000")

    watch(app.srcPath + 'images/**/*', image);
    watch(app.srcPath + 'scss/**/*.scss', css);
    watch(app.srcPath + 'ts/**/*.ts', series(tsc, js));
    watch(app.srcPath + 'js/**/*.js', js);
    watch(app.srcPath + '**/*.html', html);
    cb()
}

/*--------开发模式-DEV-END--------*/

/*--------发布模式-BUILD-START--------*/
function image_build() {
    return src(app.srcPath + 'images/**/*')
        .pipe(rev())
        .pipe(dest(app.buildPath + 'images'))
        .pipe(rev.manifest())
        .pipe(dest(app.revPath + 'images'));
}

function scss_build() {
    return src(app.srcPath + 'scss/**/*.scss')
        .pipe(sass())
        .pipe(dest(app.srcPath + 'css'));
}

function css_build() {
    return src(app.srcPath + 'css/**/*.css')
        .pipe(rev())
        .pipe(cssmin())
        .pipe(dest(app.buildPath + "css/"))
        .pipe(rev.manifest())
        .pipe(dest(app.revPath + 'css'));
}

function css_clean(cb) {
    return del([app.srcPath + 'css'], cb);
}

function tsc_build() {
    return src(app.srcPath + 'ts/**/*.ts')
        .pipe(ts())
        .pipe(dest(app.srcPath + 'js'));
}

function js_build() {
    return src(app.srcPath + 'js/**/*.js')
        .pipe(rev())
        .pipe(uglify())
        .pipe(dest(app.buildPath + 'js/'))
        .pipe(rev.manifest())
        .pipe(dest(app.revPath + 'js'));
}

function image_rev_collector() {
    return src([app.revPath + "**/*.json", app.buildPath + "**/*.css"])
        .pipe(revCollector({replaceReved: true}))
        .pipe(dest(app.buildPath + '/'));
}

function html_build() {
    return src([app.revPath + "**/*.json", app.srcPath + "**/*.html"])
        .pipe(revCollector({replaceReved: true}))
        //.pipe(htmlMin(html_min_options))
        .pipe(dest(app.buildPath + '/'));
}

function build_clean(cb) {
    return del([app.revPath, app.buildPath], cb);
}

/*--------发布模式-BUILD-END--------*/

exports.tsc = tsc;
exports.clean = clean;

exports.build = series(build_clean, image_build, scss_build, css_build, tsc_build, js_build, image_rev_collector,  html_build, css_clean);
exports.default = series(image, css, tsc, js, html, server);