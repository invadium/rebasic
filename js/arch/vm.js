'use strict'

const WELCOME = "Welcome back to basic!"
const VERSION = "Rebasic Version 0.1"
const READY  = "Ready..."

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

const util = {
    expectNumber: function(n) {
        if (typeof n !== 'number'
                || Number.isNaN(n)) {
            throw `Number is expected: [${n}]`
        }
    },
    expectInteger: function(n) {
        if (typeof n !== 'number'
                || Number.isNaN(n)
                || !Number.isInteger(n)) {
            throw `Integer is expected: [${n}]`
        }
    },
    expectString: function(s) {
        if (typeof s === 'string') {
            throw `String is expected: [${s}]`
        }
    },
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
        this.MAX_CYCLES = 10000
        this.MAX_OUTPUTS = 10
        this.lastLine = 0
        this.ram = []
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
        this.constant = {}

        this.pos = 0
        this.cycles = 0
        this.outputs = 0
        this.bstack = []
        this.rstack = []
        this.data = []
        this.dataPos = 0
        this.interrupted = false
        this.skipLookup = false
        this.util = util

        const vm = this
        this.inputHandler = function(cmd) {

            if (vm.interrupted && vm.resumeOnInput) {
                // vm waits for input
                vm.assign(vm.inputTarget, cmd)
                vm.interrupted = false
                vm.resume()

            } else {
                if (!cmd) return
                try {
                    const dot = cmd.startsWith('.')
                    let ln = parseInt(cmd)
                    if (dot || !isNaN(ln)) {
                        let cmdLine = cmd
                        if (dot) {
                            vm.lastLine += 10
                            ln = vm.lastLine
                            cmd = cmd.substring(1)
                            cmd = ln + ' ' + cmd
                        } else {
                            const i = cmd.indexOf(' ')
                            if (i >= 0) {
                                cmdLine = cmd.substring(i+1).trim()
                            } else {
                                cmdLine = false
                            }

                            if (ln > vm.lastLine) {
                                vm.lastLine = ln
                            }
                        }
                        if (!cmdLine) vm.lines[ln] = false
                        else vm.lines[ln] = cmd

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

        this.resume = function() {
            while(!vm.interrupted && vm.pos < vm.code.length) {
                vm.next(vm.code[vm.pos ++])

                if (vm.outputs > vm.MAX_OUTPUTS) {
                    vm.outputs = 0
                    setTimeout(vm.resume, 0)
                    return
                }
                if (vm.cycles > vm.MAX_CYCLES) {
                    vm.cycles = 0
                    setTimeout(vm.resume, 0)
                    return
                }
            }

            if (!vm.interrupted && !vm.loop) {
                vm.command.close()
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

    defineConst(name, val) {
        // handle possible number values
        if (!name.endsWith('$')) {
            const n = parseFloat(val)
            if (!isNaN(n)) val = n
        }
        this.scope[name] = val
        this.constant[name] = val
    }

    assign(name, val) {
        // handle possible number values
        if (!name.endsWith('$')) {
            const n = parseFloat(val)
            if (!isNaN(n)) val = n
        }
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
        this.cycles ++

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

    run(block, pos) {
        // execute all statements in the code sequence
        this.pos = pos? pos : 0
        this.code = block.code
        this.interrupted = false
        this.resume()
    }

    repl() {
        this.loop = true
        this.printWelcome()
    }

    interrupt() {
        this.interrupted = true
        this.resumeOnInput = false
    }

    waitForInput() {
        this.interrupted = true
        this.resumeOnInput = true
    }

    stop() {
        if (!this.interrupted || this.resumeOnInput) {
            this.interrupt()
            this.command.print('interrupted...')
        }
    }

    source(from, to) {
        from = from || 0
        to = to || this.lines.length - 1

        let res = []
        for (let i = from; i <= to; i++) {
            const line = this.lines[i]
            if (line) res.push(line)
        }
        return res.join('\n')
        //return this.lines.filter(l => l).join('\n')
    }

    loadSource(src) {
        if (!src) this.lines = []
        else this.lines = src.split('\n').filter(l => l && !l.startsWith('#'))
        this.command.print('loaded ' + this.lines.length + ' lines')
    }

    exec(cmd) {
        this.inputHandler(cmd)
    }

    clearScope() {
        const scope = {}
        Object.keys(this.constant).forEach(k => {
            const v = this.constant[k]
            scope[k] = v
        })
        this.scope = scope
        this.ram = []
    }

    clearSource() {
        this.lines = []
        this.lastLine = 0
    }

    printWelcome() {
        this.command.print(WELCOME)
        this.command.print(VERSION)
        this.command.print(READY)
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
