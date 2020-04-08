const readline = require('readline')

let io

function open() {
    io = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    })
}

function print() {
    for (let i = 0; i < arguments.length; i++) {
        if (i > 0) process.stdout.write(' ')
        process.stdout.write(arguments[i])
    }
    process.stdout.write('\n')
}

function input(then) {
    if (typeof then === 'function') {
        io.on('line', then)
        return
    }

    for (let i = 0; i < arguments.length; i++) {
        const v = arguments[i]

        if (typeof v === 'object' && v.id) {
            this.assign(v.id, 'not defined')
        } else {
            console.log(v)
        }
    }
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
