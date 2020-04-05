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
                console.log(val.toString())
                if (!lex.expect(lex.OPERATOR, ')')) {
                    lex.err(`) is expected`)
                }
                return val

            } else {
                lex.err(`unexpected operator ${token.val}`)
            }
        }

        const val = token.val
        return {
            val: val,
            get: function() {
                return this.val
            },
            toString: valToString,
        }
    }

    function moreMD(lval) {
        const token = lex.next()
        if (!token) return lval

        if (token.type === lex.OPERATOR) {
            if (token.val === '*') {
                const rval = expectVal(atomicVal)
                return moreMD({
                    lval: lval,
                    rval: rval,
                    get: function mul() {
                        return this.lval.get() * this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            } else if (token.val === '/') {
                const rval = expectVal(atomicVal)
                return moreMD({
                    lval: lval,
                    rval: rval,
                    get: function div() {
                        return this.lval.get() / this.rval.get()
                    },
                    toString: binaryOpToString,
                })
            } else if (token.val === '\\') {
                const rval = expectVal(atomicVal)
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
                const rval = expectVal(atomicVal)
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
        const lval = atomicVal()
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

    function doExpr() {
        return exprAS()
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
