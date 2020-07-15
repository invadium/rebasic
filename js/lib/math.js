
const fn = {
    abs: Math.abs,
    rnd: Math.random,
    sin: Math.sin,
    cos: Math.cos,
    tan: Math.tan,
    atn: Math.atan,
    atn2: Math.atan2,
    'int': Math.floor,
    exp: Math.exp,
    log: Math.log,
    sgn: Math.sign,
    sqr: Math.sqrt,
}

fn.abs.usage = '(x)'
fn.abs.man = 'absolute value of the number'

fn.rnd.usage = '()'
fn.rnd.man = 'random number in the range 0-1'

fn.sin.usage = '(x)'
fn.sin.man = 'sine of [x]'

fn.cos.usage = '(x)'
fn.cos.man = 'cosine of [x]'

fn.tan.usage = '(x)'
fn.tan.man = 'tangent of [x]'

fn.atn.usage = '(x)'
fn.atn.man = 'angle in radians for tangent of [x]'

fn.atn2.usage = '(y, x)'
fn.atn2.man = 'angle to the ray passing [y, x]'

fn['int'].usage = '(x)'
fn['int'].man = 'truncate the value of [x]\n'
    + '    the result is an integer value\n'
    + '    always less than [x]'

fn.exp.usage = '(x)'
fn.exp.man = 'value of e raised to the power of x'

fn.log.usage = '(x)'
fn.log.man = 'natural log of [x]'

fn.sgn.usage = '(x)'
fn.sgn.man = 'sign of [x] => -1/0/+1'

fn.sqr.usage = '(x)'
fn.sqr.man = 'square root of [x]'

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
