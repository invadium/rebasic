'use strict'

function vmPrint() {
    for (let i = 0; i < arguments.length; i++) {
        console.log(arguments[i])
    }
}

function vmInput() {
    for (let i = 0; i < arguments.length; i++) {
        const v = arguments[i]

        if (typeof v === 'object' && v.id) {
            this.assign(v.id, 'not defined')
        } else {
            console.log(v)
        }
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
        this.lastLine = 0
        this.lines = []

        this.label = {}
        this.command = {
            'goto': true,
            'gosub': true,
            'read': true,
            'restore': true,
            'print': vmPrint,
            'input': vmInput,
        }
        this.fun = {}
        this.scope = {}

        this.pos = 0
        this.bstack = []
        this.rstack = []
        this.data = []
        this.dataPos = 0
        this.interrupted = false
        this.skipLookup = false

        const vm = this
        this.inputHandler = function(cmd) {
            if (!cmd) return

            if (vm.interrupted) {
                vm.interrupted = false
                vm.assign(vm.inputTarget, cmd)
                vm.resume()

            } else {
                try {
                    const dot = cmd.startsWith('.')
                    let ln = parseInt(cmd)
                    if (dot || !isNaN(ln)) {
                        if (dot) {
                            vm.lastLine += 10
                            ln = vm.lastLine
                            cmd = cmd.substring(1)
                            cmd = ln + ' ' + cmd
                        } else {
                            if (ln > vm.lastLine) {
                                vm.lastLine = ln
                            }
                        }
                        vm.lines[ln] = cmd

                    } else {

                        const lex = vm.lexFromSource(
                                cmd, vm.command.print)
                        const code = vm.parse(vm, lex)
                        vm.run(code, 0)
                    }

                } catch (e) {
                    vm.command.print('' + e)
                }
            }
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

    store(val) {
        this.data.push(val)
    }

    read(name) {
        if (this.dataPos >= this.data.length) {
            throw 'no data left to read'
        }
        this.assign(name, this.data[this.dataPos++])
    }

    defineFun(name, fn) {
        this.fun[name] = fn
    }

    defineCmd(name, fn) {
        this.command[name] = fn
    }

    assign(name, val) {
        this.scope[name] = val
    }

    load(name) {
        if (this.skipLookup) return { id: name }
        let val = this.scope[name]
        if (val === undefined) {
            throw `unknown identifier [${name}]`
        }
        return val
    }

    locate(name) {
        if (this.skipLookup) return { id: name }
        // check variables
        let val = this.scope[name]
        if (val === undefined) {
            // check labels
            val = this.label[name]
            if (val) return name

            throw `unknown identifier [${name}]`
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
                let val
                if (stmt.opt) {
                    if (stmt.immediate) {
                        this.skipLookup = true
                        val = stmt.opt.get()
                        this.skipLookup = false
                    } else {
                        val = stmt.opt.get()
                    }
                }

                switch(stmt.val) {
                    case 'goto':
                        const label = this.label[val]
                        if (!label) {
                            throw `unknown label [${val}]`
                        }
                        this.code = label.block.code
                        this.pos = label.pos
                        break

                    case 'gosub':
                        const subLabel = this.label[val]
                        if (!subLabel) {
                            throw `unknown label [${val}]`
                        }
                        this.bstack.push(this.code)
                        this.rstack.push(this.pos)
                        this.code = subLabel.block.code
                        this.pos = subLabel.pos
                        break

                    case 'read':
                        const opt = stmt.opt
                        if (opt.list) {
                            for (let i = 0; i < opt.list.length; i++) {
                                this.read(opt.list[i].val)
                            }
                        } else {
                            this.read(opt.val)
                        }
                        break

                    case 'restore':
                        this.dataPos = 0
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

            case 6:
                if (this.rstack.length === 0) {
                    // the end
                    this.pos = Number.MAX_SAFE_INTEGER
                } else {
                    this.code = this.bstack.pop()
                    this.pos = this.rstack.pop()
                }
                break

            case 7:
                // the end
                this.pos = Number.MAX_SAFE_INTEGER
                break
        }
    }

    resume() {
        while(!this.interrupted && this.pos < this.code.length) {
            this.next(this.code[this.pos ++])
        }

        if (!this.interrupted && !this.loop) {
            this.command.close()
        }
    }

    run(block, pos) {
        // execute all statements in the code sequence
        this.pos = pos? pos : 0
        this.code = block.code
        this.resume()
    }

    repl() {
        this.loop = true
        this.command.print("Welcome back to basic!")
        this.inputHandler()
    }
}

function vmFactory() {
    const vm = new VM()
    vm.Block = Block

    return vm
}

if (module) {
    module.exports = vmFactory
} else {
    this.jbas? this.jbas.vmFactory = vmFactory : this.jbas = {
        vmFactory
    }
}
