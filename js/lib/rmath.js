// LCG random generator implementation
function LCGSourceFactory() {
    let _rnd_m = 0xFFFFFFFF
    let _rnd_a = 1664525
    let _rnd_c = 1013904223
    let _seed = 1

    // core random value
    function rndv() {
        _seed = (_rnd_a * _seed + _rnd_c) % _rnd_m
        return _seed
    }

    return {
        setSeed: function(v) {
            _seed = v
        },

        getSeed: function() {
            return _seed
        },

        // random float
        rndf: function rndf() {
            return rndv()/_rnd_m
        },
    }
}

const rndSource = LCGSourceFactory()
const initialSeed = Math.floor((performance.now() * 10)) % 1000000
rndSource.setSeed( initialSeed )

const fn = {
    abs: Math.abs,
    rnd: function(N) {
        if (N < 0) {
            const seed = abs(N)
            rndSource.setSeed(seed)
            return seed
        } if (N > 0) {
            return N * rndSource.rndf()
        } else {
            return rndSource.rndf()
        }
    },
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
fn.abs.tags = 'core, classic, math'
fn.abs.man = 'absolute value of the number'

fn.rnd.usage = '(N)'
fn.rnd.tags = 'core, classic, math'
fn.rnd.man = 'random number generator\n'
             + '  * no N - return a random value between [0..1)\n'
             + '  * N > 0 - return a random value between [0..N)\n'
             + '  * N < 0 - set the passed value as a seed'


fn.sin.usage = '(x)'
fn.sin.tags = 'core, classic, math'
fn.sin.man = 'sine of [x]'

fn.cos.usage = '(x)'
fn.cos.tags = 'core, classic, math'
fn.cos.man = 'cosine of [x]'

fn.tan.usage = '(x)'
fn.tan.tags = 'core, classic, math'
fn.tan.man = 'tangent of [x]'

fn.atn.usage = '(x)'
fn.atn.tags = 'core, classic, math'
fn.atn.man = 'angle in radians for tangent of [x]'

fn.atn2.usage = '(y, x)'
fn.atn2.tags = 'core, classic, math'
fn.atn2.man = 'angle to the ray passing [y, x]'

fn['int'].usage = '(x)'
fn['int'].tags = 'core, classic, math'
fn['int'].man = 'truncate the value of [x]\n'
    + '    the result is an integer value\n'
    + '    always less than [x]'

fn.exp.usage = '(x)'
fn.exp.tags = 'core, classic, math'
fn.exp.man = 'value of e raised to the power of x'

fn.log.usage = '(x)'
fn.log.tags = 'core, classic, math'
fn.log.man = 'natural log of [x]'

fn.sgn.usage = '(x)'
fn.sgn.tags = 'core, classic, math'
fn.sgn.man = 'sign of [x] => -1/0/+1'

fn.sqr.usage = '(x)'
fn.sqr.tags = 'core, classic, math'
fn.sqr.man = 'square root of [x]'

const scope = {
    pi: Math.PI,
    tau: Math.PI * 2,
}

const rmath = {
    fn: fn,
    scope: scope,
}

if (module) {
    module.exports = rmath
} else {
    this.jbas? this.jbas.rmath = rmath : this.jbas = {
        rmath
    }
}
