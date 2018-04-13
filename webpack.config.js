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
            another: './src/another-bundle.ts',
            'const-import': './src/const-import.ts',
            'require-test': './src/require-test.ts'
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
            // minimize: true,
            // concatenateModules: false,
            providedExports: true,
            
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
                    const [featuresModules] = c.getModules().filter(x => x.resource === this.featuresFileAbsolutePath);


                    if (!featuresModules) {
                        return;
                    }

                    const features = {};

                    c.getModules().forEach(m => {
                        if (m === featuresModules) {
                            return;
                        }

                        m.dependencies.forEach(d => {
                            if (d.module !== featuresModules) {
                                return;
                            }
                            const ref = d.getReference();
                            if (!ref || !ref.importedNames || !ref.importedNames.length) {
                                return;
                            }

                            ref.importedNames.forEach(x => {
                                const feature = features[x] = features[x] || { usage: [] };
                                feature.usage.push(path.relative(__dirname, m.resource));
                            });
                        });
                    });

                    if (Object.keys(features).length) {
                        const source = JSON.stringify({ usedFeatures: features }, null, 2);

                        compilation.assets[c.name + '.features.json'] = {
                            source: function () { return new Buffer(source); },
                            size: function () { return Buffer.byteLength(source); }
                        };
                    }
                });
            });
        });
    }
}