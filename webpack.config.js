const webpack = require("webpack");
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')

const RuntimeParameterPlugin = require('./plugin/RuntimeParameterPlugin');

/**
 * @return {webpack.Configuration}
 */
module.exports = function () {
    return {
        output: {
            filename: '[name].js',
            path: path.resolve(__dirname, 'dist')
        },
        entry: {
            main: './src/index.ts',
            another: './src/another-bundle.ts'
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'ts-loader',
                    exclude: /node_modules/
                },
                {
                    test: /features$/,
                    use: 'features-loader',
                    exclude: /node_modules/
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js']
        },
        devtool: false,
        optimization: {
            usedExports: true,
            // minimize: true,
            // concatenateModules: false,
            providedExports: true,
            splitChunks: {
                chunks: 'initial'
            }
        },
        plugins: [
            new RuntimeParameterPlugin({
                'Features': path.resolve(__dirname, 'src', 'runtime-features-provider')
            }),
            // new HtmlWebpackPlugin({
            //     //     // inject: false,
            //     filename: 'HtmlHelpers.cshtml',
            //     template: 'test.ejs',
            //     templateParameters: (compilation, assets, options) => {
            //         debugger;
            //     }
            // })
        ]
    };
}
