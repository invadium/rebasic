//to .rebas parser

function parse(vm, lex) {

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

    function doAtomicVal(target) {
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
                // no value - another operator
                lex.ret()
                return
            }

        } else if (token.type === lex.KEYWORD) {
            if (token.val === 'true'
                    || token.val === 'enabled') {
                // boolean true literal
                return {
                    val: true,
                    get: function value() {
                        return true
                    },
                    pos: token.pos,
                    line: token.line,
                    toString: valToString,
                }

            } else if (token.val === 'false'
                    || token.val === 'disabled') {
                // boolean false literal
                return {
                    val: false,
                    get: function value() {
                        return false
                    },
                    pos: token.pos,
                    line: token.line,
                    toString: valToString,
                }
            } else {
                lex.err(`unexpected keyword [${token.val}]`)
            }
        }

        const ahead = lex.ahead()
        if (ahead && ahead.type === lex.OPERATOR && ahead.val === '(') {
            // function call or array/map access

            lex.next()
            const rval = doSelector(ahead)
            //const rval = doExprList()

            if (!lex.expect(lex.OPERATOR, ')')) {
                lex.err(`) is expected after argument list`)
            }

            return {
                type: vm.CALL_OR_FETCH,
                lval: token.val,
                rval: rval,
                get: function fnCallOrFetch() {
                    // try to locate a variable
                    const variable = vm.probe(this.lval)

                    if (variable instanceof vm.Dim) {
                        if (!this.rval) throw new Error('array index is expected')
                        return this.rval.select(variable)
                    } else if (variable instanceof vm.Map) {
                        if (!this.rval) throw new Error('map key is expected')
                        return this.rval.select(variable)
                        //return vm.locateElement( this.lval, this.rval )

                    } else {
                        // it's not a variable - must be a function
                        return vm.call(this.lval, this.rval)
                    }
                },
                pos: token.pos,
                line: token.line,
                toString: function() {
                    return `${this.lval}(${this.rval})`
                },
            }
        }

        if (token.type === lex.STR || token.type === lex.NUM) {
            // string or number literal
            return {
                val: token.val,
                get: function value() {
                    return this.val
                },
                pos: token.pos,
                line: token.line,
                toString: valToString,
            }
        } else  {
            // variable locator
            return {
                type: vm.VAR_LOC,
                val: token.val,
                get: function value() {
                    return vm.locate(this.val)
                },

                pos: token.pos,
                line: token.line,
                toString: () => token.val,
            }
        }

        lex.err(`unexpected token ${token.val}`)
    }

    function exprUN() {
        const token = lex.next()
        if (!token) return

        if (token.type === lex.KEYWORD && token.val === 'not') {
            const rval = expectVal(doAtomicVal)
            return {
                val: rval,
                get: function not() {
                    return !this.val.get()
                },
                pos: token.pos,
                line: token.line,
                toString: unaryOpToString,
            }

        } else if (token.type === lex.OPERATOR) {

            if (token.val === '-') {
                const rval = expectVal(doAtomicVal)
                return {
                    val: rval,
                    get: function unaryMinus() {
                        const v = this.val.get()
                        if (typeof v !== 'number') {
                            // TODO central handling of runtime errors
                            throw new Error('number is expected for unary -')
                        }
                        return v * -1
                    },
                    pos: token.pos,
                    line: token.line,
                    toString: unaryOpToString,
                }

            } else if (token.val === '%') {
                const rval = expectVal(doAtomicVal)
                return {
                    val: rval,
                    get: function unaryPercent() {
                        const v = this.val.get()
                        if (typeof v !== 'number') {
                            throw new Error('number is expected for unary %')
                        }
                        return Math.floor(v)
                    },
                    pos: token.pos,
                    line: token.line,
                    toString: unaryOpToString,
                }

            } else if (token.val === '~') {
                const rval = expectVal(doAtomicVal)
                return {
                    val: rval,
                    get: function unaryTilda() {
                        const v = this.val.get()
                        if (typeof v !== 'number') {
                            throw new Error('number is expected for unary ~')
                        }
                        return Math.round(v)
                    },
                    pos: token.pos,
                    line: token.line,
                    toString: unaryOpToString,
                }

            } else if (token.val === '!') {
                const rval = expectVal(doAtomicVal)
                return {
                    val: rval,
                    get: function unaryExcl() {
                        const v = this.val.get()
                        if (typeof v !== 'number') {
                            throw new Error('number is expected for unary !')
                        }
                        return Math.ceil(v)
                    },
                    pos: token.pos,
                    line: token.line,
                    toString: unaryOpToString,
                }
            } else {
                lex.ret()
                return doAtomicVal()
            }

        } else {
            lex.ret()
            return doAtomicVal()
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
                    toString: binaryOpToString,
                })
            } else if (token.val === '^') {
                const rval = expectVal(doAtomicVal)

                return {
                    lval: lval,
                    rval: rval,
                    get: function power() {
                        return Math.pow(this.lval.get(),
                            this.rval.get())
                    },
                    pos: token.pos,
                    line: token.line,
                    toString: binaryOpToString,
                }
            }
        } else if (token.type === lex.KEYWORD) {
            if (token.val === 'mod') {
                const rval = expectVal(exprUN)
                return moreMD({
                    lval: lval,
                    rval: rval,
                    get: function mod() {
                        return this.lval.get() % this.rval.get()
                    },
                    pos: token.pos,
                    line: token.line,
                    toString: binaryOpToString,
                })
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
                    pos: token.pos,
                    line: token.line,
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
        const ahead = lex.ahead()
        if (ahead && ahead.type === lex.OPERATOR && ahead.val === ',') {
            return {
                type: vm.NIL,
                get: () => '<NIL>',
            }
        }
        return exprOR()
    }

    function doExprList(command) {
        let list = []

        let expr
        let ahead
        while(expr = doExpr()) {
            list.push(expr)

            ahead = lex.ahead()
            if (ahead && (ahead.type !== lex.OPERATOR
                    || (ahead.val !== ',' && ahead.val !== ';'))) {
                break
            }

            const next = lex.next()
            if (command === 'print') {
                if (next && next.val === ';') {
                    // print val is closed by a semicolon
                    list.push({
                        type: vm.SEMICOLON,
                        get: () => {
                            return { semi: true }
                        }
                    })
                } else if (next && next.val === ',') {
                    // print val is closed by a comma
                    list.push({
                        type: vm.COMMA,
                        get: () => {
                            return { comma: true }
                        }
                    })
                }
            }
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
            },
            toString: function() {
                return list.join(',')
            },
        }
    }

    function doDataList() {
        const ls = []
        lex.mask.data = true

        let token = lex.next()
        while(token) {
            ls.push(token)
            token = lex.next()
            if (token) {
                // looks like next data element
                if (token.type !== lex.OPERATOR || token.val !== ',') {
                    lex.err(`a comma [,] is expected for next data element`)
                }
                token = lex.next() // consume next data element
            }
        }

        lex.mask.data = false
        return ls
    }

    function doExprInList() {
        const lval = doExprList()

        if (!lval) return []
        if (lval.list) return lval.list
        return [ lval ]
    }

    function doMoreTargets() {
        const token = lex.next()
        if (token.type !== lex.SYM) lex.err('variable identifier is expected')

        const ahead = lex.ahead()
        if (ahead && ahead.type === lex.OPERATOR && ahead.val === '(') {
            // array/map target
            lex.next()
            const ival = doSelectorSet(ahead)

            if (!lex.expect(lex.OPERATOR, ')')) {
                lex.err(`an expression must be closed with )`)
            }

            return {
                type: vm.TAR_SET,
                lval: token.val, 
                ival: ival,

                set: function(data) {
                    const container = vm.locate(this.lval)
                    if (!container) throw Error(`unable to find container [${this.lval}]`)
                    this.ival.set(container, data)
                },


                pos:  token.pos,
                line: token.line,
                toString: function() {
                    return `${ival}`
                },
            }

        } else {
            return {
                type: vm.TAR_SET,
                val:  token.val,

                set:  function(data) {
                    vm.assign(this.val, data)
                },
            }
        }
    }

    function doTargetList(headerToken, targetList) {
        const target = doMoreTargets()
        if (!target) return targetList

        const more = lex.ahead()
        if (more && more.type === lex.OPERATOR && more.val === ',') {
            lex.next()

            if (!targetList) {
                targetList = {
                    type: vm.TAR_LIST,
                    list: [ target ],

                    toString: function() {
                        return '' + this.list
                    }
                }
            } else {
                targetList.list.push(target)
            }
            return doTargetList(more, targetList)
            
        } else {
            if (targetList) {
                targetList.list.push(target)
                return targetList
            } else {
                return target
            }
        }
    }

    function doSelector(headerToken) {
        const ival = doExprList()
        if (!ival) return

        const ahead = lex.ahead()
        if (ahead && ahead.type === lex.OPERATOR && ahead.val === ':') {
            // do the next selection
            lex.next()

            const nextSelector = doSelector(ahead)
            return {
                type: vm.GET_EL,
                ival: ival,
                nval: nextSelector,
                select: function(headTarget) {
                    if (!headTarget) throw new Error('missing a container for element selection')
                    return this.nval.select( headTarget.get( this.ival.get() ) )
                },

                pos:  headerToken.pos,
                line: headerToken.line,
                toString: function() {
                    return `${this.ival}:${this.nextSelector}`
                },
            }
        }

        // mono-set
        return {
            type: vm.GET_EL,
            ival: ival,
            select:  function(target) {
                if (!target) throw new Error('missing a container for element selection')
                return target.get(this.ival.get())
            },
            get: function() {
                return this.ival.get()
            },

            pos:  headerToken.pos,
            line: headerToken.line,
            toString: function() {
                return `${this.ival}`
            },
        }
    }

    function doSelectorSet(headerToken) {
        const ival = doExprList()
        if (!ival) return

        const ahead = lex.ahead()
        if (ahead.type === lex.OPERATOR && ahead.val === ':') {
            // do the next selection
            lex.next()

            const nextSelector = doSelectorSet(ahead)
            return {
                type: vm.SET_EL,
                ival: ival,
                nval: nextSelector,
                set: function(headTarget, data) {
                    if (!headTarget) throw new Error('missing a container for element assignment')
                    this.nval.set( headTarget.get( this.ival.get() ), data )
                },

                pos:  headerToken.pos,
                line: headerToken.line,
                toString: function() {
                    return `${this.ival}:${this.nextSelector}`
                },
            }
        }

        // mono-set
        return {
            type: vm.SET_EL,
            ival: ival,
            set:  function(target, data) {
                if (!target) throw new Error('missing a container for element assignment')
                target.set(this.ival.get(), data)
            },

            pos:  headerToken.pos,
            line: headerToken.line,
            toString: function() {
                return `${this.ival}`
            },
        }
    }

    function consumeLabel() {
        const label = lex.next()
        if (!label) return

        if (label.type !== lex.NUM && label.type !== lex.SYM) {
            lex.err('label or line number is expected')
        }
        return label.val
    }

    function doStatement(block) {
        const token = lex.next()

        if (!token) return

        if (token.type === lex.NUM) {
            // line number
            doLabel(block, token)
            return doStatement(block)

        } else if (token.type === lex.SYM) {
            const ahead = lex.ahead()

            if (ahead && ahead.type === lex.OPERATOR) {
                if (ahead.val === ':') {
                    // named label
                    lex.next()
                    doLabel(block, token)
                    return doStatement(block)

                } else if (ahead.val === '=') {
                    // no-let assignment statement
                    lex.next()

                    const rval = doExpr()
                    return {
                        type: vm.LET,
                        lval: token.val,
                        rval: rval,
                        pos: token.pos,
                        line: token.line,
                        toString: function() {
                            return `${this.lval} = ${this.rval}`
                        },
                    }
                } else if (ahead.val === '(') {
                    // array assign element
                    lex.next()

                    // key or index
                    const selectorSet = doSelectorSet(ahead)
                    if (!lex.expect(lex.OPERATOR, ')')) {
                        lex.err(`) is expected`)
                    }

                    // parse assignment expression
                    if (!lex.expect(lex.OPERATOR, '=')) {
                        lex.err(`= is expected`)
                    }

                    const rval = doExpr()

                    return {
                        type: vm.LET_EL,
                        lval: token.val,
                        ival: selectorSet,
                        rval: rval,

                        set: function(target) {
                            if (!this.ival) throw new Error('key or index is expected')
                            this.ival.set(target, this.rval.get())
                        },

                        pos:  token.pos,
                        line: token.line,
                        toString: function() {
                            return `${this.lval}(${this.ival}) = ${this.rval}`
                        },
                    }
                }
            }

        } else if (token.type === lex.KEYWORD) {

            if (token.val === 'rem') {
                lex.skipLine()
                return doStatement(block)

            } else if (token.val === 'let') {
                // assume an assignment statement is following
                const variable = lex.next()

                if (!variable || variable.type !== lex.SYM) {
                    lex.err('variable assignmnet is expected after let')
                }
                if (!lex.expect(lex.OPERATOR, '=')) {
                    lex.err(`= is expected`)
                }

                const rval = doExpr()

                return {
                    type: vm.LET,
                    lval: variable.val,
                    rval: rval,

                    pos: token.pos,
                    line: token.line,
                    toString: function() {
                        return `let ${this.lval} = ${this.rval}`
                    },
                }

            } else if (token.val === 'dim') {
                const array = lex.next()

                if (!array || array.type !== lex.SYM) {
                    lex.err('array name is expected')
                }
                if (!lex.expect(lex.OPERATOR, '(')) {
                    lex.err(`( is expected`)
                }

                const rlist = doExprList()

                if (!lex.expect(lex.OPERATOR, ')')) {
                    lex.err(`) is expected`)
                }

                return {
                    type: vm.DIM,
                    lval: array.val,
                    rval: rlist,

                    pos: token.pos,
                    line: token.line,
                    toString: function() {
                        return `dim ${this.lval}(${this.rval})`
                    },
                }

            } else if (token.val === 'map') {
                const map = lex.next()

                if (!map || map.type !== lex.SYM) {
                    lex.err('map name is expected')
                }

                return {
                    type: vm.MAP,
                    lval: map.val,

                    pos: token.pos,
                    line: token.line,
                    toString: function() {
                        return `map ${this.lval}`
                    },
                }

            } else if (token.val === 'read') {
                const rval = doTargetList(token)

                return {
                    type: vm.READ,
                    rval: rval,
                    immediate: true,

                    pos: token.pos,
                    line: token.line,
                    toString: function() {
                        return `read ${this.rval}`
                    },
                }

            } else if (token.val === 'data') {
                //const list = doExprInList()
                const list = doDataList()
                for (let i = 0; i < list.length; i++) {
                    const val = list[i].val
                    vm.store(val)
                }
                return doStatement(block)

            } else if (token.val === 'if') {
                const cond = doExpr()

                let lstmt, rstmt

                // switch between then/goto/gosub
                const next = lex.next()
                if (next && next.type === lex.KEYWORD && next.val ==='then') {
                    lstmt = doThenStatement(block)

                    const ahead = lex.ahead()
                    if (ahead && ahead.type === lex.KEYWORD
                            && ahead.val === 'else') {
                        lex.next()
                        rstmt = doStatement(block)
                    }

                } else if (next && next.type === lex.KEYWORD && next.val === 'goto') {
                    const opt = doExprList('goto')
                    lstmt = {
                        type: vm.COMMAND,
                        val:  'goto',
                        opt:  opt,

                        pos:  next.pos,
                        line: next.line,
                        toString: function() {
                            return `${this.val} ${this.opt}`
                        },
                    }

                    const ahead = lex.ahead()
                    if (ahead && ahead.type === lex.KEYWORD
                            && ahead.val === 'else') {
                        lex.next()
                        const opt = doExprList('goto')
                        rstmt = {
                            type: vm.COMMAND,
                            val:  'goto',
                            opt:  opt,

                            pos:  next.pos,
                            line: next.line,
                            toString: function() {
                                return `${this.val} ${this.opt}`
                            },
                        }
                    }

                } else if (next && next.type === lex.KEYWORD && next.val === 'gosub') {
                    const opt = doExprList('gosub')
                    lstmt = {
                        type: vm.COMMAND,
                        val:  'gosub',
                        opt:  opt,

                        pos:  next.pos,
                        line: next.line,
                        toString: function() {
                            return `${this.val} ${this.opt}`
                        },
                    }

                    const ahead = lex.ahead()
                    if (ahead && ahead.type === lex.KEYWORD
                            && ahead.val === 'else') {
                        lex.next()
                        const opt = doExprList('gosub')
                        rstmt = {
                            type: vm.COMMAND,
                            val:  'gosub',
                            opt:  opt,

                            pos:  next.pos,
                            line: next.line,
                            toString: function() {
                                return `${this.val} ${this.opt}`
                            },
                        }
                    }

                } else {
                    lex.err(`[then|goto|gosub] expected!`)
                }

                return {
                    type: vm.IF,
                    cond: cond,
                    lstmt: lstmt,
                    rstmt: rstmt,

                    pos: token.pos,
                    line: token.line,
                }

            } else if (token.val === 'on') {
                const variable = lex.next()
                if (!variable || variable.type !== lex.SYM) {
                    lex.err('a variable to switch on is expected')
                }

                // goto or gosub
                let type = 0
                const ahead = lex.ahead()
                if (ahead && ahead.type === lex.KEYWORD
                        && ahead.val === 'goto') {
                    type = vm.ON_GOTO
                } else if (ahead.type === lex.KEYWORD
                        && ahead.val === 'gosub') {
                    type = vm.ON_GOSUB
                } else {
                    lex.err(`[goto] or [gosub] expected`)
                }
                lex.next()

                // consume labels
                const labels = []

                let expectMoreLabels = true
                while(expectMoreLabels) {
                    const label = consumeLabel()
                    labels.push(label)

                    const ahead = lex.ahead()
                    if (ahead && ahead.type === lex.OPERATOR && ahead.val === ',') {
                        lex.next() // consume comma - we expect more labels to come
                    } else {
                        expectMoreLabels = false // no more labels
                    }
                }

                return {
                    type:   type,
                    lval:   variable.val,
                    labels: labels,

                    pos:  token.pos,
                    line: token.line,
                }

            } else if (token.val === 'for') {
                const controlVar = lex.next()

                if (!controlVar || controlVar.type !== lex.SYM) {
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
                if (ahead && ahead.type === lex.KEYWORD
                            && ahead.val === 'step') {
                    lex.next()
                    step = doExpr()
                }

                const cmd = {
                    type: vm.FOR,
                    cvar: controlVar.val,
                    lval: lval,
                    rval: rval,
                    step: step,
                    jumpTo: block.length() + 1,

                    pos: token.pos,
                    line: token.line,
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
                    type: vm.NEXT,
                    forCommand: cmd,

                    pos: token.pos,
                    line: token.line,
                    toString: function() {
                        return `for ${this.cvar} = ${this.lval}`
                            + ` to ${this.rval} step ${this.step}`
                    }
                }

            } else if (token.val === 'return') {
                return {
                    type: vm.RETURN,
                    pos: token.pos,
                    line: token.line,
                    toString: function() {
                        return 'return'
                    }
                }

            } else if (token.val === 'stop' || token.val === 'end') {
                return {
                    type: vm.END,
                    pos: token.pos,
                    line: token.line,
                    toString: function() {
                        return 'end'
                    }
                }
            }
        }

        const cmd = {
            type: vm.COMMAND,
            val: token.val,

            pos: token.pos,
            line: token.line,
            toString: function() {
                return `${this.val} ${this.opt}`
            },
        }

        const opt = doExprList(token.val)
        if (opt) cmd.opt = opt

        if (token.val === 'input'
                || token.val === 'help'
                || token.val === 'help!') {
            cmd.immediate = true
        }

        return cmd
    }

    function doThenStatement(block) {
        const token = lex.next()

        if (!token) return

        if (token.type === lex.NUM) {
            return {
                type: vm.COMMAND,
                val:  'goto',
                opt:  {
                    val: token.val,
                    get: function value() {
                        return this.val
                    },
                    pos:  token.pos,
                    line: token.line,
                    toString: valToString,
                },

                pos:  token.pos,
                line: token.line,
                toString: function() {
                    return `${this.val} ${this.opt}`
                },
            }

        } else if (token.type === lex.OPERATOR && token.val === '@') {
            // goto label
            const label = lex.next()
            if (!label || label.type !== lex.SYM) lex.err('a label name is expected')

            return {
                type: vm.COMMAND,
                val:  'goto',
                opt:  {
                    val: label.val,
                    get: function value() {
                        return this.val
                    },
                    pos:  label.pos,
                    line: label.line,
                    toString: valToString,
                },

                pos:  token.pos,
                line: token.line,
                toString: function() {
                    return `${this.val} ${this.opt}`
                },
            }

        } else {
            lex.ret()
            return doStatement(block)
        }
    }

    function doBlock(tab, block) {
        let op
        while(op = doStatement(block)) {
            block.push(op)
        }
    }

    // create and parse root block
    const rootBlock = new vm.Block(lex)
    doBlock(0, rootBlock)

    return rootBlock
}

if (module) {
    // node or collider
    module.exports = parse
} else {
    this.jbas? this.jbas.parse = parse : this.jbas = {
        parse
    }
}
