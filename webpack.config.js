const webpack = require('webpack');
const path = require('path');
const extractTextWebpackPlugin = require('extract-text-webpack-plugin');
const htmlWebpackPlugin = require('html-webpack-plugin');

const extractLess = new extractTextWebpackPlugin('style.css');
const htmlBuild = new htmlWebpackPlugin({
    title: 'runway',
    template: path.join(__dirname, 'source', 'index.html'),
    filename: path.join('./', 'index.html'),
    inject: 'body'
});

const HotModuleReplacementPlugin = new webpack.HotModuleReplacementPlugin();
const NoErrorsPlugin = new webpack.NoEmitOnErrorsPlugin();

module.exports = {
    entry: {
        index: ['babel-polyfill', path.join(__dirname, 'source', 'client', 'entry.js')]
    },
    output: {
        path: path.join(__dirname, '..', '..', 'build', 'client'),
        publicPath: '/',
        filename: "[name].bundle.js"
    },
    devtool: 'source-map',
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: 'babel-loader'
        }, {
            test: /iview.src.*?js$/,
            use: 'babel-loader'
        }, {
            test: /\.less$/,
            loader: extractTextWebpackPlugin.extract({ fallback: 'style-loader', use: 'css-loader!less-loader' })
        }, {
            test: /\.css$/,
            loader: extractTextWebpackPlugin.extract({ fallback: 'style-loader', use: 'css-loader' })
        }, {
            test: /\.(png|jpg|jpge|gif)$/,
            use: 'url-loader?limit=8192&name=./images/[name].[ext]',
        }, {
            test: /\.(woff|woff2|svg|eot|ttf)\??.*$/,
            use: 'file-loader?name=./fonts/[name].[ext]',
        }]
    },
    resolve: {
        extensions: ['.js', '.json', '.less']
    },
    plugins: [htmlBuild, extractLess, HotModuleReplacementPlugin, NoErrorsPlugin]
};