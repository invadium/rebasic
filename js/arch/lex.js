'use strict'

const SYM = 1
const NUM = 2
const STR = 3
const OPERATOR = 4
const KEYWORD = 5

const OP = [
    '(',
    ')',
    '*',
    '/',
    '\\',
    '%',
    '^',
    '~',
    '!',
    '+',
    '-',
    '<',
    '>',
    '=',
    ',',
    ':',
    ';',
]

const KEYWORDS = [
    'rem',
    'let',
    'data',
    'if',
    'then',
    'else',
    'for',
    'to',
    'step',
    'next',
    'return',
    'stop',
    'end',
    'dim',
    'map',

    'not',
    'and',
    'or',

    'true',
    'false',
    'on',
    'off',
    'enabled',
    'disabled',
]

let TAB = 4

function isSpace(c) {
    return c === ' ' || c === '\t'
}

function isNewLine(c) {
    return c === '\r' || c === '\n'
}

function isSeparator(c) {
    return isSpace(c) || isNewLine(c) || isOperator(c)
}

function isOperator(c) {
    return OP.includes(c)
}

function isKeyword(word) {
    return KEYWORDS.includes(word)
}

function isSpecial(c) {
    return isOperator(c)
}

function isDigit(c) {
    const code = c.charCodeAt(0) - 48
    return code >= 0 && code < 10
}

function toDec(c) {
    const code = c.charCodeAt(0) - 48
    if (code >= 0 && code < 10) return code
    else return -1
}

function isHex(c) {
    const code = c.toUpperCase().charCodeAt(0) - 48
    return (code >= 0 && code < 10) || (code >= 17 && code < 23)
}

function toHex(c) {
    const code = c.toUpperCase().charCodeAt(0) - 48
    if (code >= 0 && code < 10) return code
    else if (code >= 17 && code < 23) return code - 7
    else return -1
}

function isAlpha(c) {
    return !isSeparator(c) && !isDigit(c) && !isSpecial(c)
}

function isAlphaNum(c) {
    return c && !isSeparator(c) && !isSpecial(c)
}

function makeInputStream(src) {
    let pos = 0
    let buf = false
    let bufc

    function cur() {
        if (buf) return pos-1
        else return pos
    }

    function getc() {
        if (buf) buf = false
        else bufc = src.charAt(pos++)
        return bufc
    }

    function retc() {
        if (buf) throw "stream buffer overflow"
        buf = true
    }

    function aheadc() {
        const c = getc()
        retc()
        return c
    }

    function expectc(c) {
        if (getc() !== c) throw `${c} is expected`
    }

    function eatc(c) {
        let i = 0
        while(getc() === c) i++
        retc()
        return i
    }

    function notc(c) {
        if (getc() === c) throw `${c} is not expected`
    }

    return {
        cur: cur,
        getc: getc,
        retc: retc,
        eatc: eatc,
        aheadc: aheadc,
        expectc: expectc,
        notc: notc,
    }
}

function makeLex(src, getc, retc, eatc, aheadc,
            expectc, notc, cur, print) {
    let mark = 0
    let lineNum = 1
    let lineShift = 0
    let tab = 0
    let lineLead = true // beginning of a string flag
    const lines = []

    function lineFrom(shift) {
        let dump = ''
        while (shift < src.length) {
            const c = src[shift++]
            if (c !== '\n') dump += c
            else break
        }
        return dump
    }

    function dumpLine(line, pos) {
        const lines = src.split('\n')
        const ln = lines[line-1]
        if (!ln) return

        let cur = ''
        for (let j = 0; j < pos-1; j++) cur += ' '
        cur += '^'

        print(ln)
        print(cur)
    }

    function dumpSource(shift, pos) {
        let dump = ''
        let cur = ''

        dump = lineFrom(shift)

        for (let j = 0; j < pos-1; j++) cur += ' '
        cur += '^'

        print(dump)
        print(cur)
    }

    function err(msg) {
        dumpSource(lineShift, mark-lineShift)
        const err = 'error ' + lineNum + '.' + (mark-lineShift) + ': ' + msg
        //print(err)
        throw err
    }

    function xerr (msg) {
        dumpSource(lineShift, mark-lineShift)
        const err = 'lex error ' + lineNum + '.' + (mark-lineShift) + ': ' + msg
        //print(err)
        throw err
    }

    function markLine () {
        lineNum ++
        lineShift = cur()
        lines.push(lineShift)
        tab = 0
        lineLead = true
    }

    function skipLine() {
        let c = getc()
        while (c && !isNewLine(c)) c = getc()
        if (isNewLine(c)) markLine()
    }

    function afterLineComment() {
        skipLine()
        return parseNext()
    }

    function afterMultiComment(cc, len) {
        skipLine()

        while (isSpace(aheadc())) getc()

        const i = eatc(cc)
        if (i === len) {
            // end of multiline
            skipLine()
            return parseNext()
        }
        return afterMultiComment(cc, len)
    }

    function parseNext() {

        let c = getc()
        if (!c) return false

        // skip spaces
        while (isSpace(c)) {
            c = getc()
            if (lineLead) {
                if (c === '\t') tab += TAB - ((cur()-lineShift)%TAB)
                else tab ++
            }
        }

        // next line
        if (isNewLine(c)) {
            const n = getc()
            if (c === '\n' && n !== '\r') {
                retc()
            }
            markLine()
            return parseNext()
        }

        if (c === '#') return afterLineComment()

        // skip -- and multiline ---- comments
        if (c === '-' || c === '=') {
            const cc = c
            if (aheadc() === cc) {
                getc()

                if (aheadc() === cc) {
                    let len = eatc(cc) + 2
                    return afterMultiComment(cc, len)

                } else {
                    return afterLineComment()
                }
            }
        }

        // got to an actual token
        mark = cur()

        // operator
        if (isOperator(c)) {
            let op = c
            if (c === '<') {
                if (aheadc() === '>') {
                    op = '<>'; getc();
                } else if (aheadc() === '=') {
                    op = '<='; getc();
                }
            } else if (c === '>' && aheadc() === '=') {
                op = '>='; getc();
            }

            return {
                type: OPERATOR,
                tab: tab,
                val: op,
                pos:  cur() - lineShift,
                line: lineNum,
            }
        }

        // string
        if (c === '"' || c === "'") {
            const strTerm = c
            let s = ''
            c = getc()
            while (c && c !== strTerm && !isNewLine(c)) {
                s += c
                c = getc()
            }

            if (c !== strTerm) xerr('unexpected end of string')

            return {
                type: STR,
                tab: tab,
                val: s,
                pos:  cur() - lineShift,
                line: lineNum,
            }
        }

        let sign = 1
        if (c === '-') {
            sign = -1
            c = getc()
        }

        if (isDigit(c)) {
            let n = 0
            const nextc = aheadc()
            if (c === '0' && nextc === 'x') {
                getc() // eat x
                if (sign < 0) xerr("hex value can't be negative")


                let d = toHex(getc())
                if (d < 0) {
                    xerr('wrong hex number format')
                }
                while (d >= 0) {
                    n = n*16 + d
                    d = toHex(getc())
                }
                retc()

                return {
                    type: NUM,
                    tab: tab,
                    val: n,
                    pos:  cur() - lineShift,
                    line: lineNum,
                }
            } else if (c === '0' && nextc !== '.' && !isDigit(nextc)) {
                // hanlde plain 0
                c = getc()
                if (c && !isSeparator(c)) xerr('wrong number format')

                retc()
                return {
                    type: NUM,
                    tab: tab,
                    val: 0,
                    pos:  cur() - lineShift,
                    line: lineNum,
                }

            } else {
                let d = 0
                while ((d = toDec(c)) >= 0) {
                    n = n*10 + d
                    c = getc()
                }

                if (c === '.') {
                    let precision = 1

                    c = getc()
                    while ((d = toDec(c)) >= 0) {
                        n = n*10 + d
                        precision *= 10
                        c = getc()
                    }

                    n = n/precision
                }

                retc()

                return {
                    type: NUM,
                    tab: tab,
                    val: sign * n,
                    pos:  cur() - lineShift,
                    line: lineNum,
                }
            }

        } else if (sign < 0) {
            xerr('wrong number format')
        }

        let sym = ''
        while ( isAlphaNum(c) ) {
            sym += c
            c = getc() 
        }
        retc()

        if (sym.length === 0) return
        sym = sym.toLowerCase() 

        if (isKeyword(sym)) {
            return {
                type: KEYWORD,
                tab: tab,
                val: sym,
                pos:  cur() - lineShift,
                line: lineNum,
            }
        }

        // identifier
        return {
            type: SYM,
            tab: tab,
            val: sym,
            pos:  cur() - lineShift,
            line: lineNum,
        }
    }

    let lastToken
    let isBuffered = false
    function next() {
        if (isBuffered) {
            isBuffered = false
        } else {
            lastToken = parseNext()
            if (lastToken) {
                if (lineLead) lastToken.lead = true
            }
            lineLead = false
        }
        return lastToken
    }

    function expect(type, val) {
        const token = next()
        if (!token) return false

        if (type && token.type !== type) return false
        if (val && token.val !== val) return false
        return true
    }

    function ahead() {
        if (!isBuffered) {
            lastToken = next()
            isBuffered = true
        }
        return lastToken
    }

    function ret() {
        if (isBuffered) {
            console.dir(lastToken)
            xerr('token buffer overflow')
        }
        isBuffered = true
    }

    return {
        next: next,
        ahead: ahead,
        expect: expect,
        ret: ret,
        skipLine: skipLine,
        err: err,
        dumpLine: dumpLine,

        SYM: SYM,
        NUM: NUM,
        STR: STR,
        OPERATOR: OPERATOR,
        KEYWORD: KEYWORD,
    }
} 

function lexFromSource(src, print) {
    print = print || console.out
    const stream = makeInputStream(src)
    return makeLex(src,
                    stream.getc,
                    stream.retc,
                    stream.eatc,
                    stream.aheadc,
                    stream.expectc,
                    stream.notc,
                    stream.cur,
                    print)
}

if (module) {
    module.exports = lexFromSource
} else {
    this.jbas? this.jbas.lexFromSource = lexFromSource
        : this.jbas = {
            lexFromSource
        }
}
