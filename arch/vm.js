
function doDot() {
    console.log(".")
}

function doPrint() {
    for (let i = 0; i < arguments.length; i++) {
        console.log(arguments[i])
    }
}

class Block {
    constructor() {
        this.code = []
    }

    push(op) {
        this.code.push(op)
    }

    length() {
        return this.code.length
    }
}

class VM {

    constructor() {
        this.pos = 0
        this.label = {}
        this.command = {
            'goto': true,
            'dot': doDot,
            'print': doPrint,
        }
        this.fun = {
            abs: Math.abs,
        }
        this.scope = {}
        this.stack = []
    }

    markLabel(name, block, pos) {
        this.label[name] = {
            block: block,
            pos: pos,
        }
        //console.log(`${name}: #${pos}`)
    }

    val(v) {
        if (!v) return 'NIL'
        if (!v.get) {
            console.dir(v)
            throw 'wrong value!'
        }
        return v.get()
    }

    assign(name, val) {
        this.scope[name] = val
    }

    load(name) {
        let val = this.scope[name]
        if (val === undefined) {
            throw `unknown identifier ${name}`
        }
        return val
    }

    locate(name) {
        // check variables
        let val = this.scope[name]
        if (val === undefined) {
            // check labels
            val = this.label[name]
            if (val) return name

            throw `unknown identifier ${name}`
        }
        return val
    }

    call(name, expr) {
        const v = this.val(expr)
        //console.log('calling ' + name + '(' + v + ')')
        const fn = this.fun[name]
        if (!fn) throw `unknown function [${name}]`

        if (Array.isArray(v)) {
            return fn.apply(this, v)
        } else {
            return fn.call(this, v)
        }
    }

    next(stmt) {
        if (!stmt) return

        //console.log(stmt.toString())
        switch(stmt.type) {
            case 1:
                // command
                const cmd = this.command[stmt.val]
                if (!cmd) throw `Unknown command [${stmt.val}]`

                // calculate param set
                const val = stmt.opt.get()

                switch(stmt.val) {
                    case 'goto':
                        const label = this.label[val]
                        if (!label) {
                            throw `unknown label [${val}]`
                        }
                        this.code = label.block.code
                        this.pos = label.pos
                        break

                    default:
                        if (Array.isArray(val)) {
                            cmd.apply(this, val)
                        } else {
                            cmd.call(this, val)
                        }
                }
                break

            case 2: 
                // assignment
                const lval = stmt.lval
                const rval = stmt.rval.get()
                //console.log('assignment ' + lval + ' = ' + rval)
                this.assign(lval, rval)
                break

            case 3:
                // if - then - else
                const cond = stmt.cond.get()
                if (cond) {
                    this.next(stmt.lstmt)
                } else {
                    this.next(stmt.rstmt)
                }
                break

            case 4:
                // for - to - step init
                this.assign(stmt.cvar, stmt.lval.get())
                break

            case 5:
                // next
                const cfor = stmt.forCommand
                let i = this.load(cfor.cvar)
                const step = cfor.step? cfor.step.get() : 1
                const to = cfor.rval.get()

                i += step
                this.assign(cfor.cvar, i)

                if (i <= to) {
                    this.pos = cfor.pos
                }
                break

        }
    }

    run(block, pos) {
        // execute all statements in the code sequence
        this.pos = pos
        this.code = block.code

        while(this.pos < this.code.length) {
            this.next(this.code[this.pos ++])
        }
    }
}

function vmFactory() {
    const vm = new VM()
    vm.Block = Block

    return vm
}

if (module) {
    module.exports = vmFactory
}
