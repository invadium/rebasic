
function doDot() {
    console.log(".")
}

function doPrint(vm, op) {
    console.log(vm.val(op.opt))
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
        return v.get()
    }

    run(block) {
        const code = block.code

        // execute all opcodes in the code sequence
        let i = 0
        while(i < code.length) {
            const op = code[i++]

            console.log(op.toString())
            switch(op.type) {
                case 1:
                    const cmd = this.command[op.val]
                    if (!cmd) throw `Unknown command [${op.val}]`
                    cmd(this, op)
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
