
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
        this.label = {}
        this.command = {
            'dot': doDot,
            'print': doPrint,
        }
        this.fun = {
            abs: Math.abs,
        }
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

    run(block) {
        const code = block.code

        // execute all opcodes in the code sequence
        let i = 0
        while(i < code.length) {
            const op = code[i++]

            //console.log(op.toString())
            switch(op.type) {
                case 1:
                    const cmd = this.command[op.val]
                    if (!cmd) throw `Unknown command [${op.val}]`

                    // calculate param set
                    const val = op.opt.get()

                    if (Array.isArray(val)) {
                        cmd.apply(this, val)
                    } else {
                        cmd.call(this, val)
                    }
                    break
            }
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
