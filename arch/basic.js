// .jbs parser

// @depends(lib/arch/op)

function basic(vm, lex) {

    function doLabel(block, token) {
        vm.markLabel(token.val, block, block.length())
    }

    function expectVal(fn) {
        const val = fn()
        if (val) return val
        else lex.err('a value is expected!')
    }

    function unaryOpToString() {
        return `${this.get.name}(${this.val})`
    }

    function binaryOpToString() {
        return `${this.get.name}(${this.lval}, ${this.rval})`
    }

    function valToString() {
        if (typeof this.val === 'string') return `"${this.val}"`
        return this.val
    }


    // ========================
    //    expression parsing
    // ========================

    function atomicVal() {
        const token = lex.next()

        if (!token) return
        if (token.lead) {
            // token from the next line - give it back
            lex.ret()
            return
        }

        if (token.type === lex.OPERATOR) {
            if (token.val === '(') {
                const val = doExpr()
                if (!lex.expect(lex.OPERATOR, ')')) {
                    lex.err(`) is expected`)
                }
                return val

            } else {
                lex.err(`unexpected operator ${token.val}`)
            }
        } else if (token.type === lex.KEYWORD) {
            if (token.val === 'true'
                    || token.val === 'on'
                    || token.val === 'enabled') {
                return {
                    val: true,
                    get: function value() {
                        return true
                    },
                    toString: valToString,
                }

            } else if (token.val === 'false'
                    || token.val === 'off'
                    || token.val === 'disabled') {
                return {
                    val: false,
                    get: function value() {
                        return false
                    },
                    toString: valToString,
                }
            } else {
                lex.err(`unexpected keyword ${token.val}`)
            }
        }

        const val = token.val
        return {
            val: val,
            get: function value() {
                return this.val
            },
            toString: valToString,
        }
    }

    function notVal() {
        const token = lex.next()
        if (!token) return

        if (token.type === lex.KEYWORD && token.val === 'not') {
            const rval = expectVal(atomicVal)
            return {
                val: rval,
                get: function not() {
                    return !this.val.get()
                },
                toString: unaryOpToString,
            }

        } else if (token.type === lex.OPERATOR && token.val === '-') {
            const rval = expectVal(atomicVal)
            return {
                val: rval,
                get: function unaryMinus() {
                    const v = this.val.get()
                    if (typeof v !== 'number') {
                        // TODO central handling of runtime errors
                        throw 'number is expected for unary opp'
                    }
                    return v * -1
                },
                toString: unaryOpToString,
            }

        } else {
            lex.ret()
            return atomicVal()
        }
        return lval
    }

    function moreMD(lval) {
        const token = lex.next()
        if (!token) return lval

        if (token.type === lex.OPERATOR) {
            if (token.val === '*') {
                const rval = expectVal(notVal)
                return moreMD({
                    lval: lval,
                    rval: rval,
                    get: function mul() {
                        return this.lval.get() * this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            } else if (token.val === '/') {
                const rval = expectVal(notVal)
                return moreMD({
                    lval: lval,
                    rval: rval,
                    get: function div() {
                        return this.lval.get() / this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            } else if (token.val === '\\') {
                const rval = expectVal(notVal)
                return moreMD({
                    lval: lval,
                    rval: rval,
                    get: function idiv() {
                        return Math.floor(this.lval.get()
                            / this.rval.get())
                    },
                    toString: binaryOpToString,
                })
            } else if (token.val === '%') {
                const rval = expectVal(notVal)
                return moreMD({
                    lval: lval,
                    rval: rval,
                    get: function mod() {
                        return this.lval.get() % this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            }
        } 
        lex.ret()
        return lval
    }

    function exprMD() {
        const lval = notVal()
        return moreMD(lval)
    }

    function moreAS(lval) {
        const token = lex.next()
        if (!token) return lval

        if (token.type === lex.OPERATOR) {
            if (token.val === '+') {
                const rval = expectVal(exprMD)
                return moreAS({
                    lval: lval,
                    rval: rval,
                    get: function add() {
                        return this.lval.get() + this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            } else if (token.val === '-') {
                const rval = expectVal(exprMD)
                return moreAS({
                    lval: lval,
                    rval: rval,
                    get: function substract() {
                        return this.lval.get() - this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            }
        } 
        lex.ret()
        return lval
    }

    function exprAS() {
        const lval = exprMD()
        return moreAS(lval)
    }

    function moreCMP(lval) {
        const token = lex.next()
        if (!token) return lval

        if (token.type === lex.OPERATOR) {
            if (token.val === '<') {
                const rval = expectVal(exprAS)
                return moreCMP({
                    lval: lval,
                    rval: rval,
                    get: function less() {
                        return this.lval.get() < this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            } else if (token.val === '<=') {
                const rval = expectVal(exprMD)
                return moreCMP({
                    lval: lval,
                    rval: rval,
                    get: function lessEq() {
                        return this.lval.get() <= this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            } else if (token.val === '>') {
                const rval = expectVal(exprMD)
                return moreCMP({
                    lval: lval,
                    rval: rval,
                    get: function more() {
                        return this.lval.get() > this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            } else if (token.val === '>=') {
                const rval = expectVal(exprMD)
                return moreCMP({
                    lval: lval,
                    rval: rval,
                    get: function moreEq() {
                        return this.lval.get() >= this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            }
        } 
        lex.ret()
        return lval
    }

    function exprCMP() {
        const lval = exprAS()
        return moreCMP(lval)
    }

    function moreEQ(lval) {
        const token = lex.next()
        if (!token) return lval

        if (token.type === lex.OPERATOR) {
            if (token.val === '=') {
                const rval = expectVal(exprAS)
                return moreEQ({
                    lval: lval,
                    rval: rval,
                    get: function eq() {
                        return this.lval.get() == this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            } else if (token.val === '<>') {
                const rval = expectVal(exprMD)
                return moreEQ({
                    lval: lval,
                    rval: rval,
                    get: function notEq() {
                        return this.lval.get() != this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            }
        } 
        lex.ret()
        return lval
    }

    function exprEQ() {
        const lval = exprCMP()
        return moreEQ(lval)
    }

    function moreAND(lval) {
        const token = lex.next()
        if (!token) return lval

        if (token.type === lex.KEYWORD) {
            if (token.val === 'and') {
                const rval = expectVal(exprEQ)
                return moreAND({
                    lval: lval,
                    rval: rval,
                    get: function and() {
                        return this.lval.get() && this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            }
        } 
        lex.ret()
        return lval
    }

    function exprAND() {
        const lval = exprEQ()
        return moreAND(lval)
    }

    function moreOR(lval) {
        const token = lex.next()
        if (!token) return lval

        if (token.type === lex.KEYWORD) {
            if (token.val === 'or') {
                const rval = expectVal(exprAND)
                return moreOR({
                    lval: lval,
                    rval: rval,
                    get: function or() {
                        return this.lval.get() || this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            }
        } 
        lex.ret()
        return lval
    }

    function exprOR() {
        const lval = exprAND()
        return moreOR(lval)
    }

    function doExpr() {
        return exprOR()
    }

    function doExprList() {
        let opt = []

        let expr
        while(expr = doExpr()) {
            opt.push(expr)
        }

        if (opt.length === 0) return
        else if (opt.length === 1) return opt[0]
        else return opt
    }

    function doCommand(block) {
        const token = lex.next()

        if (!token) return

        if (token.type === lex.NUM) {
            doLabel(block, token)
            return doCommand(block)
        }

        const cmd = {
            type: 1,
            val: token.val,
            toString: function() {
                return `${this.val} ${this.opt}`
            },
        }

        const opt = doExprList()
        if (opt) cmd.opt = opt

        return cmd
    }

    function doBlock(tab, block) {
        let op
        while(op = doCommand(block)) {
            block.push(op)
        }
    }

    const rootBlock = new vm.Block
    doBlock(0, rootBlock)

    return rootBlock
}

if (module) {
    // node or collider
    module.exports = basic
}
