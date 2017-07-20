const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin');

const path = require('path');

const uglifyJsPlugin = new webpack.optimize.UglifyJsPlugin({
    minimize: true,
    sourceMap: true,
    compress: {
        warnings: false
    }
});
const analyzer = new BundleAnalyzerPlugin();
const lodash = new LodashModuleReplacementPlugin();



module.exports = {
    entry: {
        'entry': path.join(__dirname, 'source', 'client', 'entry.js'),
        'fetch-source': path.join(__dirname, 'source', 'client', 'index.js'),
    },
    output: {
        path: path.join(__dirname, 'dist'),
        publicPath: '/',
        filename: "[name].js"
    },
    devtool: 'source-map',
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: 'babel-loader'
        }]
    },
    resolve: {
        extensions: ['.js', '.json', '.less']
    },
    plugins: [lodash, uglifyJsPlugin]
};