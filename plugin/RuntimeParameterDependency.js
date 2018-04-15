"use strict";

const ConstDependency = require("webpack/lib/dependencies/ConstDependency");

class RuntimeParameterDependency extends ConstDependency {
    constructor(expression, range, parameterSet, parameterKey) {
        super();
        this.expression = expression;
        this.range = range;
        this.requireWebpackRequire = false;
        this.parameterSet = parameterSet;
        this.parameterKey = parameterKey;
    }
}

module.exports = RuntimeParameterDependency;
