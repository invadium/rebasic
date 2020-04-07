const readline = require('readline')

const io = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

io.on('line', (line) => {
    console.log('#' + line)
})

function print() {
    for (let i = 0; i < arguments.length; i++) {
        if (i > 0) process.stdout.write(' ')
        process.stdout.write(arguments[i])
    }
    process.stdout.write('\n')
}

function input() {
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
    io.close
}

module.exports = {
    print,
    input,
    close,
}
