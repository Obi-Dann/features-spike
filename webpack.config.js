const webpack = require("webpack");
const path = require('path');

const RuntimeInjectionPlugin = require('./plugin/RuntimeInjectionPlugin');
const RuntimeInjectionReporterPlugin = require('./plugin/RuntimeInjectionReporterPlugin');
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

        },
        plugins: [
            new RuntimeInjectionPlugin({
                'Features': path.resolve(__dirname, 'src', 'runtime-features-provider')
            }),
            new RuntimeInjectionReporterPlugin(),
        ]
    };
}
