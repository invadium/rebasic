
const fn = {
    abs: Math.abs,
    rnd: Math.random,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    atn: Math.atan,
    atn2: Math.atan2,
}

const scope = {
    pi: Math.PI,
    tau: Math.PI * 2,
}

const math = {
    fn: fn,
    scope: scope,
}

if (module) {
    module.exports = math
} else {
    this.jbas? this.jbas.math = math : this.jbas = {
        math
    }
}
