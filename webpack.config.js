var webpack = require('webpack');
var path = require('path');
var currentDir = process.cwd();

module.exports = {
    entry: {
        'app': './static/js/react/index.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.join(currentDir, 'static/js/dist')
    },
    resolve: {
        modules: [
            currentDir,
            path.resolve(currentDir, 'node_modules')
        ],
        extensions: ['.ts', '.js', '.json'],
        symlinks: false
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.ts$/,
                use: [{
                    loader: 'awesome-typescript-loader',
                    options: {
                        ignoreDiagnostics: [
                            2300 // omit 'TS2300: Duplicate identifier' type of errors
                        ]
                    }
                }]
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            }
        ]
    },
    optimization: {
        splitChunks: {
            name: true,
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]|static\/js\/vendor|/,
                    name: "vendors",
                    chunks: "all"
                },
            default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        }
    },
    watch: true,
    cache: true,
    devtool: false
};