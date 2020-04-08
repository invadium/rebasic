const readline = require('readline')

let io

function open() {
    console.log('opening io...')
    io = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
}

function print() {
    for (let i = 0; i < arguments.length; i++) {
        if (i > 0) process.stdout.write(' ')
        process.stdout.write('' + arguments[i])
    }
    process.stdout.write('\n')
}

function input(then) {
    if (typeof then === 'function') {
        // set command handler
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
    this.interrupted = true
}

function close() {
    io.close()
}

module.exports = {
    open,
    print,
    input,
    close,
}
