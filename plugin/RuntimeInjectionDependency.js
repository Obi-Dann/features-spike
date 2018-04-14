"use strict";

const ConstDependency = require("webpack/lib/dependencies/ConstDependency");

class RuntimeInjectionDependency extends ConstDependency {
    constructor(expression, range, injectionSet, injectionKey) {
        super();
        this.expression = expression;
        this.range = range;
        this.requireWebpackRequire = false;
        this.injectionSet = injectionSet;
        this.injectionKey = injectionKey;
    }
}

module.exports = RuntimeInjectionDependency;
