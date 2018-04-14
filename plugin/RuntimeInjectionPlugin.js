"use strict";

const ParserHelpers = require("webpack/lib/ParserHelpers");
const ConstDependency = require("webpack/lib/dependencies/ConstDependency");
const NullFactory = require("webpack/lib/NullFactory");
const RuntimeInjectionDependency = require('./RuntimeInjectionDependency');

class RuntimeInjectionPlugin {
    constructor(definitions) {
        this.definitions = definitions;
    }

    apply(compiler) {
        const definitions = this.definitions;

        compiler.hooks.compilation.tap(
            "RuntimeInjectionPlugin",
            (compilation, { normalModuleFactory }) => {
                compilation.dependencyFactories.set(RuntimeInjectionDependency, new NullFactory());
                compilation.dependencyTemplates.set(
                    RuntimeInjectionDependency,
                    new ConstDependency.Template()
                );

                const handler = (parser, parserOptions) => {
                    Object.keys(definitions).forEach(name => {
                        var request = [].concat(definitions[name]);

                        parser.hooks.expressionAnyMember.for(name).tap("RuntimeInjectionPlugin", expr => {
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
                            const nameIdentifier = `__webpack_runtime_injected_${combinedName.replace(/\./g, "_dot_")}`;
                            const expression = `require(${JSON.stringify(request[0])})(${JSON.stringify(propertyName)})`;

                            if (
                                !ParserHelpers.addParsedVariableToModule(
                                    parser,
                                    nameIdentifier,
                                    expression
                                )
                            ) {
                                return false;
                            }

                            var dep = new RuntimeInjectionDependency(nameIdentifier, expr.range, name, propertyName);
                            dep.loc = expr.loc;
                            parser.state.current.addDependency(dep);

                            return true;
                        });
                    });
                };
                normalModuleFactory.hooks.parser
                    .for("javascript/auto")
                    .tap("RuntimeInjectionPlugin", handler);
                normalModuleFactory.hooks.parser
                    .for("javascript/dynamic")
                    .tap("RuntimeInjectionPlugin", handler);
                normalModuleFactory.hooks.parser
                    .for("javascript/esm")
                    .tap("RuntimeInjectionPlugin", handler);
            }
        );


    }
}

module.exports = RuntimeInjectionPlugin;
