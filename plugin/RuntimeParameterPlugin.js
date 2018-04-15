"use strict";

const ParserHelpers = require("webpack/lib/ParserHelpers");
const ConstDependency = require("webpack/lib/dependencies/ConstDependency");
const NullFactory = require("webpack/lib/NullFactory");
const Template = require('webpack/lib/Template');
const RuntimeParameterDependency = require('./RuntimeParameterDependency');
const SortableSet = require('webpack/lib/util/SortableSet');

const runtimeParametersExtensionKey = 'rp';
const buildMetaKey = 'runtimeParameters';

class RuntimeParameterPlugin {
    constructor(definitions) {
        this.definitions = definitions;
    }

    apply(compiler) {
        const definitions = this.definitions;

        compiler.hooks.compilation.tap(
            "RuntimeParameterPlugin",
            (compilation, { normalModuleFactory }) => {
                compilation.dependencyFactories.set(RuntimeParameterDependency, new NullFactory());
                compilation.dependencyTemplates.set(
                    RuntimeParameterDependency,
                    new ConstDependency.Template()
                );

                const handler = (parser, parserOptions) => {
                    Object.keys(definitions).forEach(name => {
                        var request = [].concat(definitions[name]);

                        parser.hooks.expressionAnyMember.for(name).tap("RuntimeParameterPlugin", expr => {
                            let propertyName;
                            switch (expr.property.type) {
                                case "Identifier":
                                    propertyName = expr.property.name;
                                    break;
                                case "Literal":
                                    propertyName = expr.property.value;
                                    break;
                                default:
                                    return false;
                            }

                            const combinedName = `${name}_${propertyName}`;
                            const nameIdentifier = `__webpack_runtime_parameter_${combinedName.replace(/\./g, "_dot_")}`;
                            const expression = `__webpack_require__.${runtimeParametersExtensionKey}[${JSON.stringify(name)}][${JSON.stringify(propertyName)}]`;

                            if (
                                !ParserHelpers.addParsedVariableToModule(
                                    parser,
                                    nameIdentifier,
                                    expression
                                )
                            ) {
                                return false;
                            }

                            var dep = new RuntimeParameterDependency(nameIdentifier, expr.range, name, propertyName);
                            dep.loc = expr.loc;
                            parser.state.current.addDependency(dep);

                            return true;
                        });
                    });
                };
                normalModuleFactory.hooks.parser
                    .for("javascript/auto")
                    .tap("RuntimeParameterPlugin", handler);
                normalModuleFactory.hooks.parser
                    .for("javascript/dynamic")
                    .tap("RuntimeParameterPlugin", handler);
                normalModuleFactory.hooks.parser
                    .for("javascript/esm")
                    .tap("RuntimeParameterPlugin", handler);

                compilation.hooks.afterOptimizeChunks.tap('RuntimeParameterPlugin', () => {
                    compilation.modules.forEach(module => {
                        const definedParameters = [];

                        module.dependencies.forEach(d => {
                            if (!(d instanceof RuntimeParameterDependency)) {
                                return;
                            }
                            const readableIdentifier = module.readableIdentifier(compilation.requestShortener);

                            definedParameters.push({
                                parameterSet: d.parameterSet,
                                parameterKey: d.parameterKey,
                                usage: `${readableIdentifier}:${d.loc.start.line}:${d.loc.start.column}`
                            });
                        });

                        if (!definedParameters.length) {
                            return;
                        }

                        for (const entry of getEntriesForModule(module)) {
                            const buildMeta = entry.runtimeChunk.entryModule.buildMeta;
                            const meta = buildMeta[buildMetaKey] = buildMeta[buildMetaKey] || {};
                            const parameters = meta.parameters = meta.parameters || {};

                            for (const x of definedParameters) {
                                const parameterSet = parameters[x.parameterSet] = parameters[x.parameterSet] || {};
                                const parameter = parameterSet[x.parameterKey] =
                                    parameterSet[x.parameterKey] || { usage: new SortableSet(undefined, sortByLocale) };

                                parameter.usage.add(x.usage);
                            }
                        }
                    });
                });

                compilation.mainTemplate.hooks.beforeStartup.tap('RuntimeParameterPlugin', (source, chunk, hash) => {
                    if (!chunk.entryModule) {
                        return "";
                    }

                    const runtimeParameters = chunk.entryModule && chunk.entryModule.buildMeta[buildMetaKey];
                    if (!runtimeParameters) {
                        return "";
                    }

                    const buf = [];
                    var globalObject = compilation.mainTemplate.outputOptions.globalObject;
                    var ns = `webpackRuntimeParameters_${chunk.hash}`;
                    var runtimeParametersVar = `${globalObject}[${JSON.stringify(ns)}] = ${globalObject}[${JSON.stringify(ns)}] || {};`;
                    chunk.entryModule.buildMeta.runtimeParameters.variable = `${globalObject}[${JSON.stringify(ns)}]`;

                    buf.push("// Load runtime parameters from global");
                    buf.push(`${compilation.mainTemplate.requireFn}.${runtimeParametersExtensionKey} = ${runtimeParametersVar}`);
                    buf.push("");
                    return Template.asString(buf);
                });
            }
        );
    }
}

function* getEntriesForModule(module) {
    for (const chunk of module.chunksIterable) {
        const entries = getEntriesForChunk(chunk)
        for (const entry of entries) {
            yield entry;
        }
    }
}

function* getEntriesForChunk(chunk) {
    for (const group of chunk.groupsIterable) {
        const entries = getEntriesForGroup(group)
        for (const entry of entries) {
            yield entry;
        }
    }
}

function* getEntriesForGroup(group) {
    if (group.isInitial()) {
        yield group;
        return;
    }

    for (const parent of group.parentsIterable) {
        const entries = getEntriesForGroup(parent);
        for (const entry of entries) {
            yield entry;
        }
    }
};

function sortByLocale(a, b) {
    return a.localCompare(b);
};

module.exports = RuntimeParameterPlugin;
