const WELCOME = "Welcome to ReBASIC, Version 0.4!"
const HELP    = 'Enter "help" for instructions.'
const READY   = "Ready..."

const COMMAND       = 1
const LET           = 2
const DIM           = 3
const MAP           = 4
const IF            = 5
const ON_GOTO       = 6
const ON_GOSUB      = 7
const FOR           = 8
const DO            = 9
const DO_WHILE      = 10
const DO_UNTIL      = 11
const LOOP          = 12
const LOOP_WHILE    = 13
const LOOP_UNTIL    = 14
const BREAK         = 15
const NEXT          = 16
const RETURN        = 17
const END           = 18
const LET_EL        = 19
const SET_EL        = 20
const GET_EL        = 21
const TAR_EL        = 22
const READ          = 23

const MULTIBLOCK    = 27
const GOTO          = 28
const GOSUB         = 29

const CALL_OR_FETCH = 31
const VAR_LOC       = 32
const VAR_SET       = 33
const TAR_SET       = 34
const TAR_LIST      = 35

const NIL           = 101
const COMMA         = 102
const SEMICOLON     = 103

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
    isNumber: function(n) {
        return (typeof n === 'number' && !Number.isNaN(n))
    },
    isString: function(v) {
        return toString.call(v) === '[object String]'
    },
    isObject: function(v) {
        return (v && typeof v === 'object' && !Array.isArray(v))
    },
    isArray: function(v) {
        return Array.isArray(v)
    },
    expectNumber: function(n) {
        if (typeof n !== 'number'
                || Number.isNaN(n)) {
            throw new Error(`Number is expected: [${n}]`)
        }
    },
    expectInteger: function(n) {
        if (typeof n !== 'number'
                || Number.isNaN(n)
                || !Number.isInteger(n)) {
            throw new Error(`Integer is expected: [${n}]`)
        }
    },
    expectString: function(s) {
        if (typeof s === 'string') {
            throw new Error(`String is expected: [${s}]`)
        }
    },
}

class Block {
    constructor(lex) {
        this.lex = lex
        this.code = []
    }

    push(op) {
        this.code.push(op)
    }

    length() {
        return this.code.length
    }
}

class Dim {

    constructor(name, rval) {
        this.name  = name
        this.sizes = []

        if (util.isArray(name)) {
            this.setData(name)
            return 
        }

        if (!rval) throw new Error(`array dimensions are expected`)
        if (rval.list) {
            // multi-dimensional
            for (let i = 0; i < rval.list.length; i++) {
                const rv = rval.list[i]
                this.sizes.push( rv.get() )
            }
        } else {
            // assume one-dimension
            this.sizes.push( rval.get() )
        }
        this.dim = this.sizes.length

        let len = this.sizes[0] || -1
        for (let i = 1; i < this.sizes.length; i++) {
            len *= this.sizes[i]
        }
        this.len = len

        // setup values
        this.data = []
        for (let i = 0; i < len; i++) {
            this.data[i] = 0
        }

        //console.log(this.dim + ': ' + this.len)
        //console.dir(this.sizes)
    }

    setData(data) {
        this.data = data
        this.sizes = [ data.length ]
        this.dim = this.sizes.length
        this.len = data.length
    }

    get(at) {
        if (this.dim > 1) {
            // multi-dimensional array
            if (!Array.isArray(at) || this.dim !== at.length) {
                throw new Error(`index list of ${this.dim} elements is expected`)
            }

            let j = 0
            for (let i = 0; i < at.length - 1; i++) {
                for (let k = i + 1; k < at.length; k++) {
                    const ati = at[i]
                    if (ati <= 0 || ati > this.sizes[k-1]) throw new Error(`index [${at.join(',')}]@${ati} is out of bounds`)
                    j += (ati - 1) * this.sizes[k]
                }
            }

            const lastAt = at[at.length - 1]
            if (lastAt <= 0 || lastAt > this.sizes[this.sizes.length - 1]) {
                throw new Error(`index [${at.join(',')}]@${lastAt} is out of bounds`)
            }
            j += at[at.length - 1] - 1
            // if (j < 0 || j >= this.len) throw new Error(`index [${at.join(',')}] is out of bounds`)
            return this.data[j]

        } else {
            // one-dimensional array
            if (!util.isNumber(at)) throw new Error(`array index is expected`)
            if (at <= 0 || at > this.len) throw new Error(`index [${at}] is out of bounds`)
            return this.data[at - 1]
        }
    }

    set(at, val) {
        if (this.dim > 1) {
            // multi-dimensional array
            if (!Array.isArray(at) || this.dim !== at.length) {
                throw new Error(`index list of ${this.dim} elements is expected`)
            }

            let j = 0
            for (let i = 0; i < at.length - 1; i++) {
                let u = at[i] - 1
                for (let k = i + 1; k < at.length; k++) {
                    u *= this.sizes[k]
                }
                j += u
            }

            j += at[at.length - 1] - 1

            if (j < 0 || j >= this.data.length) throw new Error(`array index [${at.join(',')}] out of bounds`)
            this.data[j] = val

        } else {
            // one-dimensional array
            if (!util.isNumber(at)) throw new Error(`array index is expected`)
            if (at <= 0 || at > this.data.length) throw new Error(`array index [${at}] out of bounds`)
            
            this.data[at - 1] = val
        }
    }

    toPrint() {
        const ls = []
        for (let i = 0; i < this.data.length; i++) {
            const val = this.data[i]
            if (util.isNumber(val)) {
                ls.push('' + val)
            } else if (util.isString(val)) {
                ls.push(`"${val}"`)
            } else if (util.isObject(val) && val.toPrint) {
                ls.push(val.toPrint())
            } else {
                ls.push('')
            }
        }
        return '[' + ls.join(',') + ']'
    }

    toString() {
        const head = []
        const N = this.len < 12? this.len : 12
        const suffix = this.len > 12? '...' : ''
        for (let i = 0; i < N; i++) {
            head.push(this.data[i])
        }
        return `[${head.join(',')}${suffix}]`
    }
}

class Map {
    
    constructor(name) {
        this.name = name
        this.data = {}
    }

    get(key) {
        if (!key) throw new Error(`a map key is expected`)
        return this.data[key.toLowerCase()] || -1
    }

    set(key, val) {
        if (!key) throw new Error(`a map key is expected`)
        if (val === undefined) throw new Error(`a value is expected`)
        this.data[key.toLowerCase()] = val
    }

    getLength() {
        return Object.keys(this.data).length
    }

    toPrint() {
        const dir = []
        dir.push('{')
        Object.keys(this.data).forEach(key => {
            const val = this.data[key]
            dir.push(`  ${key}: ${val}`)
        })
        dir.push('}')
        return dir.join('\n')
    }

    toString() {
        return '{...}'
    }
}

class VM {

    constructor() {
        // export statement type constants
        this.COMMAND       = COMMAND
        this.LET           = LET
        this.DIM           = DIM
        this.MAP           = MAP
        this.IF            = IF
        this.ON_GOTO       = ON_GOTO
        this.ON_GOSUB      = ON_GOSUB
        this.FOR           = FOR
        this.DO            = DO
        this.DO_WHILE      = DO_WHILE
        this.DO_UNTIL      = DO_UNTIL
        this.LOOP          = LOOP
        this.LOOP_WHILE    = LOOP_WHILE
        this.LOOP_UNTIL    = LOOP_UNTIL
        this.BREAK         = BREAK
        this.NEXT          = NEXT
        this.RETURN        = RETURN
        this.END           = END
        this.LET_EL        = LET_EL
        this.SET_EL        = SET_EL
        this.GET_EL        = GET_EL
        this.TAR_EL        = TAR_EL
        this.READ          = READ

        this.MULTIBLOCK    = MULTIBLOCK
        this.GOTO          = GOTO
        this.GOSUB         = GOSUB

        this.CALL_OR_FETCH = CALL_OR_FETCH
        this.VAR_LOC       = VAR_LOC
        this.VAR_SET       = VAR_SET
        this.TAR_SET       = TAR_SET
        this.TAR_LIST      = TAR_LIST
        this.NIL           = NIL
        this.COMMA         = COMMA
        this.SEMICOLON     = SEMICOLON

        // export classes
        this.Dim = Dim
        this.Map = Map

        this.MAX_CYCLES = 1024
        this.MAX_OUTPUTS = 16
        this.lastLine = 0
        this.ram = []
        this.lines = []

        this.opt = {}
        this.label = {}
        this.command = {
            'goto':    {},
            'gosub':   {},
            'on':      {},
            'read':    {},
            'restore': {},
            'print':   vmPrint,
            'input':   vmInput,
        }
        this.special = {}
        this.fun = {}
        this.scope = {}
        this.constant = {}
        this.tags = []

        this.pos = 0
        this.cycles = 0
        this.outputs = 0
        this.bstack = []
        this.rstack = []
        this.data = []
        this.dataPos = 0
        this.mmap = {}
        this.skipLookup = false
        this.skipLookupStack = []
        this.util = util
        this.onRun   = function() {}
        this.onStop  = function() {}
        this.onInput = function() {}
        this.interrupt()
        this.loop = false

        const vm = this
        this.inputHandler = function(cmd) {
            // handle the next line of input
            if (vm.interrupted && vm.resumeOnInput) {
                // vm waits for the input
                vm.assignTarget(vm.inputTarget, cmd)
                vm.interrupted = false
                vm.resumeOnInput = false
                vm.onInput(true)
                vm.resume()

            } else {
                // vm is in immediate REPL mode
                vm.processCommand(cmd)
                vm.onInput(false)
            }
        }

        this.resume = function() {
            // main vm execution cycle
            // execute current command sequence in a loop
            // interrupt and reschedule on outputs or cycles limit
            while(!vm.interrupted && vm.pos < vm.code.length) {
                vm.next(vm.code[vm.pos++])

                // reschedule the next batch if needed
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

            if (vm.pos >= vm.code.length) {
                if (vm.code.__) {
                    const block = vm.code.__
                    vm.code = block.__.code
                    vm.pos = block.pos + 1
                    vm.resume()
                }

                if (!vm.resumeOnInput
                        && vm.rstack.length === 0
                        && vm.loop) {
                    vm.interrupt()
                    // TODO all we really need is to run the interrupt method()???
                    //vm.interrupted = true
                    //vm.onStop()
                }
            }
        }
    }



    placeLine(line, numberedOnly, failOnCollision) {
        // check autonumber
        const dot = line.startsWith('.')
        // check line number
        let ln = parseInt(line)
        const number = !isNaN(ln)

        if (!dot && !number && numberedOnly) return false

        let cmdLine = line
        if (dot) {
            this.lastLine += 10
            ln = this.lastLine
            line = line.substring(1)
            line = ln + ' ' + line
        } else if (number) {
            const i = line.indexOf(' ')
            if (i >= 0) {
                cmdLine = line.substring(i+1).trim()
            } else {
                cmdLine = false
            }

            if (ln > this.lastLine) {
                this.lastLine = ln
            }
        } else {
            this.lastLine ++
            ln = this.lastLine
        }
        if (!cmdLine) {
            this.lines[ln] = false // clear the line
        } else {
            if (failOnCollision && this.lines[ln]) throw new Error(`line number collision for #${ln}: ${line}`)
            this.lines[ln] = line
            if (this.onNewLine) this.onNewLine(ln)
        }

        return true
    }

    processCommand(cmd) {
        if (!cmd) return
        const placed = this.placeLine(cmd, true)

        try {
            if (!placed) {
                // not sourced - parse and run immediately
                const lex = this.lexFromSource(
                        cmd, this.command.print)
                const code = this.parse(this, lex)
                this.run(code, 0, true)
            }

        } catch (e) {
            if (!this.replMode) {
                this.dumpContext()
            }

            this.command.print(e.message)
            if (this.opt.errToConsole) {
                // graphical output, so print to console as well
                console.log(e)
            }

            if (this.opt.debug && !this.opt.errToConsole && e.stack) {
                this.command.print(e.stack)
            }
            if (this.interrupted === false) {
                this.interrupt()
            }
            if (this.exitOnError) {
                process.exit(1)
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
            throw new Error('wrong value!')
        }
        return v.get()
    }

    store(val) {
        this.data.push(val)
    }

    read(opt) {
        if (this.dataPos >= this.data.length) {
            throw new Error('no data left to read')
        }

        const dataItem = this.data[this.dataPos++]

        if (opt.type === TAR_SET) {
            opt.set(dataItem)
        } else {
            throw new Error(`can't read [${'' + opt}]`)
        }
        /*
        if (opt.type === CALL_OR_FETCH) {
            // reading to dim/map
            this.assignElementVal(opt.lval, opt.rval, dataItem)
        } else if (opt.type === VAR_LOC) {
            // reading to a variable
            this.assign(opt.val, dataItem)
        } else {
            throw new Error(`can't read [${'' + opt}]`)
        }
        */
    }

    definePatternMapping(pattern, target) {
        if (!pattern) throw new Error('mmap pattern is expected')
        if (target === undefined) throw new Error('mmap mapping value is expected')

        this.mmap[pattern.toLowerCase()] = target
    }

    mapPattern(pattern) {
        if (!pattern) return
        return this.mmap[pattern]
    }

    getByTag(tag) {
        const commands = Object.entries(this.command).filter( e => e[1] && e[1].tags && e[1].tags.indexOf(tag) >= 0 )
        const functions = Object.entries(this.fun).filter( e => e[1] && e[1].tags && e[1].tags.indexOf(tag) >= 0 )
        return commands.concat(functions)
    }

    listTags() {
        const lines = []
        this.tags.forEach(tag => {
            lines.push(`#${tag}`)
        })
        return lines.join('\n')
    }

    defineTags(tags) {
        if (!tags) return
        if (!Array.isArray(tags)) {
            tags = tags.split(',').map(tag => tag.trim())
        }

        const vm = this
        tags.forEach(tag => {
            if (vm.tags.indexOf(tag) < 0) vm.tags.push(tag)
        })

        return tags
    }

    extractTitle(fn) {
        if (fn.man) {
            const lines = fn.man.split('\n')
            fn.title = lines[0]
        }
    }

    defineFun(name, fn) {
        if (!name || typeof fn !== 'function') return
        this.fun[name] = fn
        this.extractTitle(fn)
        fn.tags = this.defineTags(fn.tags)
    }

    defineCmd(name, fn) {
        if (!name || typeof fn !== 'function') return
        this.command[name] = fn
        this.extractTitle(fn)
        fn.tags = this.defineTags(fn.tags)
    }

    defineSpecial(name, st) {
        if (!name || !st) return
        this.special[name] = st
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
            if (!isNaN(n)) {
                val = n
                //if (name.endsWith('%')) val = Math.round(val)
            }
        }
        this.scope[name] = val
    }

    assignTarget(target, val) {
        if (target.container) {
            if (!target.container.name.endsWith('$')) {
                const n = parseFloat(val)
                if (!isNaN(n)) {
                    val = n
                    //if (name.endsWith('%')) val = Math.round(val)
                }
            }
            target.container.set(target.at, val)
            return
        }

        const name = target.id
        // handle possible number values based on $ flag
        if (!name.endsWith('$')) {
            const n = parseFloat(val)
            if (!isNaN(n)) {
                val = n
                //if (name.endsWith('%')) val = Math.round(val)
            }
        }

        if (target.index) {
            // dealing with dim or map
            // TODO did that ever worked? remove?
            this.assignElementPlain(name, target.index, val)
        } else {
            this.scope[name] = val
        }
    }

    load(name) {
        if (this.skipLookup) return { id: name }
        let val = this.scope[name]
        if (val === undefined) {
            throw new Error(`unknown identifier [${name}]`)
        }
        return val
    }

    probe(name) {
        return this.scope[name]
    }

    locate(name) {
        if (this.skipLookup) return { id: name }
        // check variables
        let val = this.scope[name]
        if (val === undefined) {
            // check labels
            val = this.label[name]
            if (val) return name

            throw new Error(`unknown identifier [${name}]`)
        }
        return val
    }

    locateElement(name, rval) {
        const variable = this.locate(name)
        if (!variable) throw new Error(`unknown structure [${name}]`)

        if (this.skipLookup) {
            // we are in the input state, so don't have to locate value
            variable.index = this.val(rval)
            return variable
        }

        if (!variable.get) {
            console.dir(variable)
            throw new Error(`can't locate element of [${name}]`)
        }
        
        return variable.get( this.val(rval) )
    }

    assignElement(name, key, rval) {
        const struct = this.locate(name)
        if (!struct) throw new Error(`unknown structure [${name}]`)

        if (!(struct instanceof Dim) && !(struct instanceof Map)) {
            throw new Error('array or map is expected')
        }
        if (!key) throw new Error('key or index is expected')
        if (!rval) throw new Error('element value is expected')

        struct.set( key.get(), rval.get() )
    }

    assignElementVal(name, key, val) {
        const struct = this.locate(name)
        if (!struct) throw new Error(`unknown structure [${name}]`)

        struct.set( key.get(), val )
    }

    assignElementPlain(name, key, val) {
        const struct = this.locate(name)
        if (!struct) throw new Error(`unknown structure [${name}]`)

        struct.set( key, val )
    }

    erase(target) {
        if (!target || !target.id) throw new Error(`can't erase - a name is expected`)

        if (this.scope[target.id] !== undefined) {
            delete this.scope[target.id]
        } else {
            throw new Error(`undefined variable [${target.id}]`)
        }
    }

    call(name, expr) {
        const v = this.val(expr)
        //console.log('calling ' + name + '(' + v + ')')
        const fn = this.fun[name]
        if (!fn) throw new Error(`unknown function ${name}()`)

        if (Array.isArray(v)) {
            return fn.apply(this, v)
        } else {
            return fn.call(this, v)
        }
    }

    jumpTo(code, pos) {
        this.code = code
        this.pos  = pos
    }

    end() {
        if (this.code.__) {
            this.code = this.code.__.__.code
            this.end()
        } else {
            this.pos = this.code.length
        }
    }

    next(stmt) {
        if (!stmt) return
        this.cycles ++

        //console.log(stmt.toString())
        switch(stmt.type) {
            case COMMAND:
                // command
                const cmd = this.command[stmt.val]
                if (!cmd) throw new Error(`Unknown command [${stmt.val}]`)

                // calculate param set
                let val
                if (stmt.opt) {
                    if (stmt.noLookup) {
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
                            throw new Error(`unknown label [${val}]`)
                        }
                        this.code = label.block.code
                        this.pos  = label.pos
                        break

                    case 'gosub':
                        const subLabel = this.label[val]
                        if (!subLabel) {
                            throw new Error(`unknown label [${val}]`)
                        }
                        this.bstack.push(this.code)
                        this.rstack.push(this.pos)
                        this.code = subLabel.block.code
                        this.pos  = subLabel.pos
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

            case LET: 
                // assignment
                const varName = stmt.lval
                const rval = stmt.rval.get()
                this.assign(varName, rval)
                break

            case LET_EL:
                // set dim/map element
                const container = this.locate(stmt.lval)
                stmt.set(container, stmt.rval)
                break

            case DIM:
                // array definition
                const arrayName = stmt.lval
                const dimensions = stmt.rval
                this.assign(arrayName, new Dim(arrayName, dimensions))
                break

            case MAP:
                // map definition
                const mapName = stmt.lval
                this.assign(mapName, new Map(mapName))
                break

            case READ:
                //console.log('=== executing read! ===')
                //console.log(stmt.toString())
                //console.dir(stmt)

                const readVars = stmt.rval

                if (readVars.list) {
                    for (let i = 0; i < readVars.list.length; i++) {
                        this.read(readVars.list[i])
                    }
                } else {
                    this.read(readVars)
                }
                break

            case IF:
                // if - then - else
                const cond = stmt.cond.get()
                if (cond) {
                    this.next(stmt.lstmt)
                } else {
                    this.next(stmt.rstmt)
                }
                break

            case ON_GOTO:
                const gotoSelector = this.load(stmt.lval) - 1
                const gotoLabelName = stmt.labels[gotoSelector]

                if (gotoLabelName) {
                    // found a label to jump to
                    const gotoLabel = this.label[gotoLabelName]
                    this.code = gotoLabel.block.code
                    this.pos = gotoLabel.pos
                } else {
                    throw new Error(`no goto label selected for [${gotoSelector}]`)
                }
                break

            case ON_GOSUB:
                const gosubSelector = this.load(stmt.lval) - 1
                const gosubLabelName = stmt.labels[gosubSelector]

                if (gosubLabelName) {
                    // found a label to jump to
                    const gosubLabel = this.label[gosubLabelName]
                    this.bstack.push(this.code)
                    this.rstack.push(this.pos)
                    this.code = gosubLabel.block.code
                    this.pos  = gosubLabel.pos
                } else {
                    throw new Error(`no gosub label selected for [${gosubSelector}]`)
                }
                break

            case FOR:
                // for - to - step init
                this.assign(stmt.cvar, stmt.lval.get())
                break

            case NEXT:
                const cfor = stmt.forCommand
                let i = this.load(cfor.cvar)
                const step = cfor.step? cfor.step.get() : 1
                const to = cfor.rval.get()

                i += step
                this.assign(cfor.cvar, i)

                if (i <= to) {
                    this.jumpTo(cfor.block.code, cfor.jumpTo)
                }
                break

            case DO:
                // just go along with its
                break

            case DO_WHILE:
                // check the while condition and jump out if not true
                const doWhileCond = stmt.lval.get()
                if (!doWhileCond) {
                    this.jumpTo(stmt.loopCmd.block.code, stmt.loopCmd.jumpTo)
                }
                break

            case DO_UNTIL:
                // check the until condition and jump out if true
                const doUntilCond = stmt.lval.get()
                if (doUntilCond) {
                    this.jumpTo(stmt.loopCmd.block.code, stmt.loopCmd.jumpTo)
                }
                break

            case LOOP:
                this.jumpTo(stmt.doCmd.block.code, stmt.doCmd.jumpTo)
                break

            case LOOP_WHILE:
                const whileCond = stmt.lval.get()
                if (whileCond) {
                    this.jumpTo(stmt.doCmd.block.code, stmt.doCmd.jumpTo)
                }
                break

            case LOOP_UNTIL:
                const untilCond = stmt.lval.get()
                if (!untilCond) {
                    this.jumpTo(stmt.doCmd.block.code, stmt.doCmd.jumpTo)
                }
                break

            case BREAK:
                this.jumpTo(stmt.doCmd.loopCmd.block.code, stmt.doCmd.loopCmd.jumpTo)
                break

            case RETURN:
                if (this.rstack.length === 0) {
                    // the end
                    this.end()
                } else {
                    this.jumpTo(this.bstack.pop(), this.rstack.pop())
                }
                break

            case END:
                // the end of program
                this.end()
                break

            case MULTIBLOCK:
                //this.masterCode = this.code
                //this.masterPos = this.pos
                this.code = stmt.code
                this.pos  = 0
                break

            default:
                console.log('Unknown statement!')
                console.log(`Type: ${stmt.type}`)
                console.log(stmt.toString())
                console.dir(stmt)
                break
        }
    }

    run(block, pos, replMode) {
        // execute all statements in the code sequence
        this.replMode = !!replMode
        this.pos = pos? pos : 0
        this.dataPos = 0
        this.code = block.code
        this.lex = block.lex
        this.interrupted = false
        this.resume()
    }

    runSource(source) {
        this.clearData()
        const lex = this.lexFromSource(
                source, this.command.print)
        const code = this.parse(this, lex)
        this.run(code, 0, false)
    }

    repl() {
        this.interrupt()
        this.loop = true
        this.printWelcome()
    }

    saveState() {
        this.interruptedState = {
            pos:             this.pos,
            code:            this.code,
            label:           this.label,
            data:            this.data,
            dataPos:         this.dataPos,
            rstack:          this.rstack,
            lex:             this.lex,
            interrupted:     this.interrupted,
            resumeOnInput:   this.resumeOnInput,
            resumeOnTimeout: this.resumeOnTimeout,
        }
    }

    restoreState() {
        const st = this.interruptedState
        if (!st) return

        this.pos             = st.pos
        this.code            = st.code
        this.label           = st.label
        this.data            = st.data
        this.dataPos         = st.dataPos
        this.rstack          = st.rstack
        this.lex             = st.lex
        this.interrupted     = st.interrupted
        this.resumeOnInput   = st.resumeOnInput
        this.resumeOnTimeout = st.resumeOnTimeout
    }

    saveAndResetNoLookup() {
        this.skipLookupStack.push(this.skipLookup)
        this.skipLookup = false
    }

    restoreNoLookup() {
        this.skipLookup = this.skipLookupStack.pop()
    }


    interrupt() {
        this.interrupted = true
        this.resumeOnInput = false
        this.resumeOnTimeout = false
        this.onStop()
    }

    continueInterrupted() {
        if (!this.interruptedState) return
        this.restoreState()
        this.interrupted = false
        this.resumeOnTimeout = false
        this.resume()
    }

    waitForInput() {
        this.interrupted = true
        this.resumeOnInput = true
    }

    stop() {
        if (!this.interrupted
                || this.resumeOnInput
                || this.resumeOnTimeout) {
            this.saveState()
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

    loadSource(src, silent) {
        this.clearScope()
        this.clearSource()

        let loaded = 0
        if (src) {
            const lines = src.split('\n').filter(l => l && !l.startsWith('#'))
            for (let i = 0; i < lines.length; i++) {
                if (this.placeLine(lines[i], false, true)) loaded ++
            }
        }
        if (!silent) this.command.print(`loaded ${loaded} lines`)
    }

    exec(cmd) {
        this.inputHandler(cmd)
    }

    clearData() {
        this.dataPos = 0
        this.data = []
        this.mmap = {}
    }

    clearScope() {
        const scope = {}
        Object.keys(this.constant).forEach(k => {
            const v = this.constant[k]
            scope[k] = v
        })
        this.scope = scope
        this.clearData()
        this.ram = []
    }

    clearSource() {
        this.lines = []
        this.lastLine = 0
        this.clearData()
    }

    printWelcome() {
        this.command.print(WELCOME)
        this.command.print(HELP)
        this.command.print(READY)
    }

    dumpContext() {
        if (!this.code) return

        const pos = this.pos > 0? this.pos - 1 : 0
        const cur = this.code[pos]
        // dump statement object here?
        // console.dir(cur)
        if (cur && cur.line && cur.pos && this.lex) {
            this.lex.dumpLine(cur.line, cur.pos)
            if (this.opt.errToConsole) {
                this.lex.dumpLine(cur.line, cur.pos, (line) => console.log(line) )
            }
        }
    }

    dumpCode() {
        if (!this.code) return

        const pos = this.pos > 0? this.pos - 1 : 0
        const cur = this.code[pos]
        console.dir(cur)
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
