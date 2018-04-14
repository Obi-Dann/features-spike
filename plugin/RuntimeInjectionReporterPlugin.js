"use strict";

const RuntimeInjectionDependency = require('./RuntimeInjectionDependency');
const path = require('path');

class RuntimeInjectionReporterPlugin {

    constructor(featuresFileAbsolutePath) {
        this.featuresFileAbsolutePath = featuresFileAbsolutePath;
    }

    /**
     * 
     * @param {webpack.Compiler} compiler 
     */
    apply(compiler) {
        // const featuresRegex = /Features_(.*)/;

        compiler.hooks.compilation.tap('RuntimeInjectionReporterPlugin', compilation => {
            compilation.hooks.afterOptimizeModules.tap('RuntimeInjectionReporterPlugin', () => {

                compilation.chunks.forEach(c => {
                    const injections = {};

                    c.getModules().forEach(m => {
                        m.dependencies.forEach(d => {
                            if (!(d instanceof RuntimeInjectionDependency)) {
                                return;
                            }
                            const injectionSet = injections[d.injectionSet] = injections[d.injectionSet] || {};
                            const injection = injectionSet[d.injectionKey] = injectionSet[d.injectionKey] || { usage: [] };
                            const source = path.relative(process.cwd(), m.resource);

                            injection.usage.push(`${source}:${d.loc.start.line}:${d.loc.start.column}`);
                        });
                    });

                    if (Object.keys(injections).length) {
                        const source = JSON.stringify({ usedFeatures: injections }, null, 2);

                        compilation.assets[c.name + '.runtime-injections.json'] = {
                            source: function () { return new Buffer(source); },
                            size: function () { return Buffer.byteLength(source); }
                        };
                    }
                });
            });
        });
    }
}

module.exports = RuntimeInjectionReporterPlugin;