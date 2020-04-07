#!/usr/bin/env node
"use strict"

//
// jam basic interpreter shell
//
const fs = require('fs')
const process = require('process')

const lexFromSource = require('./js/arch/lex.js')
const basic = require('./js/arch/basic.js')
const vmFactory = require('./js/arch/vm.js')
const math = require('./js/lib/math.js')
const io = require('./js/env/io.js')

// process args
const args = process.argv;

const opt = {}
const scripts = []

let cmd = 'run'
let lastOption
let parsedOption = false

for (let i = 2; i < args.length; i++) {
    let arg = args[i]

    if (arg === '-h' || arg === '--help' || arg === 'help') {
        parsedOption = false
        cmd = 'help'
    } else {
        // expect script name
        if (arg.startsWith('-')) {
            throw `Unknown option [${arg}]`
        }
        scripts.push(arg)
    }
}

function help() {
    console.log('Usage: jbs [script]...')
}

function setupVM() {
    const vm = vmFactory()

    for (let n in math.fn) vm.defineFun(n, math.fn[n])
    for (let n in math.scope) vm.assign(n, math.scope[n])
    for (let n in io) vm.defineCmd(n, io[n])

    return vm
}

function run() {
    const vm = setupVM()

    scripts.forEach(origin => {
        const src = fs.readFileSync(origin, 'utf8')
        const lex = lexFromSource(src)
        const code = basic(vm, lex)
        vm.run(code, 0)
    })
}

switch(cmd) {
    case 'run': run(); break;
    case 'help': help(); break;
}
