
function doDot() {
    console.log(".")
}

function doPrint(vm, op) {
    op.opt.forEach(v => {
        console.log(v.val)
    })
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

    run(block) {
        let i = 0

        while(i < block.length) {
            const op = block[i++]

            //console.dir(op)
            switch(op.type) {
                case 1:
                    const cmd = this.command[op.val]
                    if (!cmd) throw `Unknown command [${op.val}]`
                    cmd(this, op)
                    break
                case 2:
                    break
            }
        }
    }
}

if (module) {
    module.exports = new VM()
}
