var path = require('path');
var CopyTask = require('copy-webpack-plugin')
module.exports = {
    entry: './static/js/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    resolve: {
        alias: {
            // this module has dot in its name which is screwing shit up
            "compass-js": path.resolve(__dirname, "node_modules/compass.js/lib/compass.js")
        }
    },
    plugins: [
    new CopyTask([
        {
            from: "src/css/*",
            to: "css",
            flatten: true
        },
        {
            from: "src/img/*",
            to: "img",
            flatten: true
        },{
        from: "node_modules/leaflet/dist/leaflet.css",
        to: "leaflet"
    }, {
        from: "node_modules/leaflet/dist/images/*",
        to: "leaflet/images",
        flatten: true
    }]), ]
};
