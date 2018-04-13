const webpack = require("webpack");
const path = require('path');

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
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js']
        },
        optimization: {
            usedExports: true,
            minimize: false,
            concatenateModules: false
        },
        plugins: [
            new ReportUnusedFeatures(path.resolve('./src/features.ts'))
        ]
    };
}

class ReportUnusedFeatures {

    constructor(featuresFileAbsolutePath) {
        this.featuresFileAbsolutePath = featuresFileAbsolutePath;
    }

    /**
     * 
     * @param {webpack.Compiler} compiler 
     */
    apply(compiler) {

        compiler.hooks.compilation.tap('ReportUnusedFeatures', compilation => {
            compilation.hooks.afterOptimizeModules.tap('ReportUnusedFeatures', () => {
                compilation.chunks.forEach(c => {
                    const [features] = c.getModules().filter(x => x.resource === this.featuresFileAbsolutePath);
                    if (features) {
                        const source = JSON.stringify({ usedFeatures: features.usedExports });

                        compilation.assets[c.name +'.features.json'] = {
                            source: function () { return new Buffer(source); },
                            size: function () { return Buffer.byteLength(source); }
                        };
                    }
                });
            });
        });
    }
}