const readline = require('readline')

let io

let OUT = ''
let PROMPT = ''

function open() {
    io = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
}

function prn() {
    this.outputs ++
    for (let i = 0; i < arguments.length; i++) {
        process.stdout.write('' + arguments[i])
    }
}

function ioPrint() {
    this.outputs ++
    //process.stdout.write(OUT)
    for (let i = 0; i < arguments.length; i++) {
        if (i > 0) process.stdout.write(' ')
        const val = arguments[i] || ''
        process.stdout.write('' + val)
    }
    process.stdout.write('\n')
}

function ioCls() {
    this.command.print('\033[2J')
}

function ioInput(then) {
    //process.stdout.write(PROMPT)
    if (typeof then === 'function') {
        // set handler hook
        io.on('line', then)
        return
    }

    // print out
    for (let i = 0; i < arguments.length; i++) {
        const v = arguments[i]

        if (typeof v === 'object' && v.id) {
            this.inputTarget = v.id
            this.assign(v.id, 'waiting for values')
        } else {
            process.stdout.write('' + v + ' ')
        }
    }
    this.interrupt(true)
}

function close() {
    io.close()
}

module.exports = {
    open,
    prn,
    print: ioPrint,
    input: ioInput,
    cls: ioCls,
    close,
}
