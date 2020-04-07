// .jbs parser

// @depends(lib/arch/op)

function basic(vm, lex) {

    const nextFor = []

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
                // ( sub-expression )
                const val = doExpr()
                if (!lex.expect(lex.OPERATOR, ')')) {
                    lex.err(`an expression must be closed with )`)
                }
                return val
            } else {
                lex.ret()
                return
            }

        } else if (token.type === lex.KEYWORD) {
            if (token.val === 'true'
                    || token.val === 'on'
                    || token.val === 'enabled') {
                // boolean true literal
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
                // boolean false literal
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

        const ahead = lex.ahead()
        if (ahead.type === lex.OPERATOR && ahead.val === '(') {
            // function call

            lex.next()
            const rval = doExprList()

            if (!lex.expect(lex.OPERATOR, ')')) {
                lex.err(`) is expected after argument list`)
            }

            return {
                lval: token.val,
                rval: rval,
                get: function call() {
                    return vm.call(this.lval, this.rval)
                },
                toString: unaryOpToString,
            }
        }

        if (token.type === lex.STR || token.type === lex.NUM) {
            // string or number literal
            return {
                val: token.val,
                get: function value() {
                    return this.val
                },
                toString: valToString,
            }
        } else  {
            // variable locator
            return {
                val: token.val,
                bind: vm,
                get: function value() {
                    return this.bind.locate(this.val)
                },
                toString: () => token.val,
            }
        }

        lex.err(`unexpected token ${token.val}`)
    }

    function exprUN() {
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

        } else if (token.type === lex.OPERATOR) {

            if (token.val === '-') {
                const rval = expectVal(atomicVal)
                return {
                    val: rval,
                    get: function unaryMinus() {
                        const v = this.val.get()
                        if (typeof v !== 'number') {
                            // TODO central handling of runtime errors
                            throw 'number is expected for unary -'
                        }
                        return v * -1
                    },
                    toString: unaryOpToString,
                }

            } else if (token.val === '%') {
                const rval = expectVal(atomicVal)
                return {
                    val: rval,
                    get: function unaryPercent() {
                        const v = this.val.get()
                        if (typeof v !== 'number') {
                            throw 'number is expected for unary %'
                        }
                        return Math.floor(v)
                    },
                    toString: unaryOpToString,
                }

            } else if (token.val === '~') {
                const rval = expectVal(atomicVal)
                return {
                    val: rval,
                    get: function unaryTilda() {
                        const v = this.val.get()
                        if (typeof v !== 'number') {
                            throw 'number is expected for unary ~'
                        }
                        return Math.round(v)
                    },
                    toString: unaryOpToString,
                }

            } else if (token.val === '!') {
                const rval = expectVal(atomicVal)
                return {
                    val: rval,
                    get: function unaryExcl() {
                        const v = this.val.get()
                        if (typeof v !== 'number') {
                            throw 'number is expected for unary !'
                        }
                        return Math.ceil(v)
                    },
                    toString: unaryOpToString,
                }
            } else {
                lex.ret()
                return atomicVal()
            }

        } else {
            lex.ret()
            return atomicVal()
        }
    }

    function moreMD(lval) {
        const token = lex.next()
        if (!token) return lval

        if (token.type === lex.OPERATOR) {
            if (token.val === '*') {
                const rval = expectVal(exprUN)
                return moreMD({
                    lval: lval,
                    rval: rval,
                    get: function mul() {
                        return this.lval.get() * this.rval.get()
                    },
                    toString: binaryOpToString,
                })

            } else if (token.val === '/') {
                const rval = expectVal(exprUN)
                return moreMD({
                    lval: lval,
                    rval: rval,
                    get: function div() {
                        return this.lval.get() / this.rval.get()
                    },
                    toString: binaryOpToString,
                })

            } else if (token.val === '\\') {
                const rval = expectVal(exprUN)
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
                const rval = expectVal(exprUN)
                return moreMD({
                    lval: lval,
                    rval: rval,
                    get: function mod() {
                        return this.lval.get() % this.rval.get()
                    },
                    toString: binaryOpToString,
                })

            } else if (token.val === '^') {
                const rval = expectVal(atomicVal)

                return {
                    lval: lval,
                    rval: rval,
                    get: function power() {
                        return Math.pow(this.lval.get(),
                            this.rval.get())
                    },
                    toString: binaryOpToString,
                }
            }
        } 
        lex.ret()
        return lval
    }

    function exprMD() {
        const lval = exprUN()
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
        let list = []

        let expr
        while(expr = doExpr()) {
            list.push(expr)

            const ahead = lex.ahead()
            if (ahead.type !== lex.OPERATOR
                    || ahead.val !== ',') {
                break
            }
            lex.next()
        }

        if (list.length === 0) return
        else if (list.length === 1) return list[0]
        else return {
            list: list,
            get: function() {
                const res = []
                for (let i = 0; i < this.list.length; i++) {
                    res.push(this.list[i].get())
                }
                return res
            }
        }
    }

    function doExprInList() {
        const lval = doExprList()

        if (!lval) return []
        if (lval.list) return lval.list
        return [ lval ]
    }

    function doStatement(block) {
        const token = lex.next()

        if (!token) return

        if (token.type === lex.NUM) {
            // string number
            doLabel(block, token)
            return doStatement(block)

        } else if (token.type === lex.SYM) {
            const ahead = lex.ahead()

            if (ahead.type === lex.OPERATOR) {
                if (ahead.val === ':') {
                    // named label
                    lex.next()
                    doLabel(block, token)
                    return doStatement(block)

                } else if (ahead.val === '=') {
                    // assignment statement
                    lex.next()

                    const rval = doExpr()
                    return {
                        type: 2,
                        lval: token.val,
                        rval: rval,
                        toString: function() {
                            return `${this.lval} = ${this.rval}`
                        },
                    }
                }
            }
        } else if (token.type === lex.KEYWORD) {

            if (token.val === 'rem') {
                lex.skipLine()
                return doStatement()

            } else if (token.val === 'let') {
                // assume an assignment statement is following
                const variable = lex.next()

                if (variable.type !== lex.SYM) {
                    lex.err('assignmnet is expected after let')
                }
                if (!lex.expect(lex.OPERATOR, '=')) {
                    lex.err(`= is expected`)
                }

                const rval = doExpr()

                return {
                    type: 2,
                    lval: variable.val,
                    rval: rval,

                    toString: function() {
                        return `let ${this.lval} = ${this.rval}`
                    },
                }

            } else if (token.val === 'data') {
                const list = doExprInList()
                for (let i = 0; i < list.length; i++) {
                    const val = list[i].val
                    vm.store(val)
                }
                return doStatement()

            } else if (token.val === 'if') {
                const cond = doExpr()

                // then
                if (!lex.expect(lex.KEYWORD, 'then')) {
                    lex.err(`[then] expected`)
                }

                const lstmt = doStatement()

                let rstmt
                const ahead = lex.ahead()
                if (ahead.type === lex.KEYWORD
                        && ahead.val === 'else') {
                    lex.next()
                    rstmt = doStatement()
                }

                return {
                    type: 3,
                    cond: cond,
                    lstmt: lstmt,
                    rstmt: rstmt,
                }

            } else if (token.val === 'for') {
                const controlVar = lex.next()

                if (controlVar.type !== lex.SYM) {
                    lex.err('loop control variable expected')
                }
                if (!lex.expect(lex.OPERATOR, '=')) {
                    lex.err(`an expression must be closed with )`)
                }

                const lval = doExpr()

                if (!lex.expect(lex.KEYWORD, 'to')) {
                    lex.err(`[to] is expected`)
                }

                const rval = doExpr()

                let step
                const ahead = lex.ahead()
                if (ahead.type === lex.KEYWORD
                            && ahead.val === 'step') {
                    lex.next()
                    step = doExpr()
                }

                const cmd = {
                    type: 4,
                    cvar: controlVar.val,
                    lval: lval,
                    rval: rval,
                    step: step,
                    pos: block.length() + 1,

                    toString: function() {
                        return `for ${this.cvar} = ${this.lval}`
                            + ` to ${this.rval} step ${this.step}`
                            + ` at ${this.pos}`
                    }
                }
                nextFor.push(cmd)
                return cmd

            } else if (token.val === 'next') {

                const cmd = nextFor.pop()
                if (!cmd) {
                    lex.err('no matching for loop for next statement')
                }
                lex.skipLine()

                return {
                    type: 5,
                    forCommand: cmd,

                    toString: function() {
                        return `for ${this.cvar} = ${this.lval}`
                            + ` to ${this.rval} step ${this.step}`
                    }
                }

            } else if (token.val === 'return') {
                return {
                    type: 6,
                    toString: function() {
                        return 'return'
                    }
                }

            } else if (token.val === 'stop' || token.val === 'end') {
                return {
                    type: 7,
                    toString: function() {
                        return 'end'
                    }
                }
            }
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

        if (token.val === 'read' || token.val === 'input') {
            cmd.immediate = true
        }

        return cmd
    }

    function doBlock(tab, block) {
        let op
        while(op = doStatement(block)) {
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
} else {
    this.jbas? this.jbas.basic = basic : this.jbas = {
        basic
    }
}
