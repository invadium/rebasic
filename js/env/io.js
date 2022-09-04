const fs = require('fs')
const readline = require('readline')

let io

let OUT = ''
let PROMPT = ''

let ROM = 'rom/'
let EXT = '.bas'

function open() {
    io = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
}

function ioPrint() {
    this.outputs ++
    //process.stdout.write(OUT)
    let semi = false
    let comma = false
    for (let i = 0; i < arguments.length; i++) {
        let val = arguments[i]
        if (val === undefined) val = ''

        if (typeof val === 'object') {
            if (val.semi) {
                semi = true
            } else if (val.comma) {
                comma = true
            }
        } else {
            if (i > 0 && !semi) process.stdout.write(' ')
            process.stdout.write('' + val)
            semi = false
            comma = false
        }
    }
    if (comma) process.stdout.write(' ')
    if (!semi && !comma) process.stdout.write('\n')
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
    this.waitForInput()
}

function load(name) {
    const vm = this

    let path = name
    if (!path.startsWith('/') && !path.startsWith('.')) {
        // looks like a file from the ROM folder
        path = ROM + name + EXT
    }

    fs.readFile(path, 'utf-8', (err, data) => {
        if (err) {
            vm.command.print("failed to open [" + path + "]")
        } else {
            vm.loadSource(data)
        }
    })
}

function save(name) {
    const vm = this
    const path = ROM + name + EXT
    const src = vm.source()
    const lines = vm.lines.length
    fs.writeFile(path, src, (err) => {
        if (err) {
            vm.command.print("failed to save [" + path + "]")
        } else {
            vm.command.print(`saved ${lines} lines to [${path}]`)
        }
    })
}

function close() {
    io.close()
}

// help data
ioPrint.usage = '(val1),(val2);(val3);...'
ioPrint.man = 'print out list of values,\n'
       + '    a space is inserted when values are separated by [,],\n'
       + '    nothing is inserted when separated by [;],\n'
       + '    no new line printed when command is closed by [;],\n'
       + '    [print] with no arguments prints a new line'

ioInput.usage = '(prompt),[variable],(variable),...'
ioInput.man = 'input values from the console,\n'
        + '    values are stored in provided variables,\n'
        + '    an optional prompt string can be supplied'

ioCls.man = 'clear the screen'

load.usage = '[filename]'
load.man = 'load a program from file to the main memory'

save.usage = '[filename]'
save.man = 'save a program to file'

module.exports = {
    open,
    print: ioPrint,
    input: ioInput,
    cls: ioCls,
    load,
    save,
    close,
}
