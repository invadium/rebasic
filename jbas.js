#!/usr/bin/env node
"use strict"

//
// jam basic interpreter shell
//
const fs = require('fs')
const process = require('process')

const lexFromSource = require('./arch/lex.js')
const basic = require('./arch/basic.js')
const vmFactory = require('./arch/vm.js')

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

function run() {
    const vm = vmFactory()

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
