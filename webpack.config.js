var path = require('path');
module.exports = {
    entry: './src/js/main.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    resolve: {
        alias: {
            // this module has dot in its name which is screwing shit up
            "compass-js": path.resolve(__dirname, "node_modules/compass.js/lib/compass.js")
        }
    }
};
