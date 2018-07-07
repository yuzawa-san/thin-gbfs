var path = require('path');
module.exports = {
    entry: {
        'bundle': './src/js/main.js',
        'sw': './src/js/service-worker.js'
    },
    output: {
        filename: '[name].js'
    },
    resolve: {
        alias: {
            // this module has dot in its name which is screwing shit up
            "compass-js": path.resolve(__dirname, "node_modules/compass.js/lib/compass.js")
        }
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: {
                loader: "babel-loader",
                options: {
                    presets: ["babel-preset-env"]
                }
            }
        }]
    }
};
