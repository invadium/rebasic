const core = {

    help: function(name) {
        const vm = this

        // normalize possible ReBasic id object
        if (name && typeof name === 'object') {
            name = name.id
        }

        if (name) {
            const fn = vm.command[name] || vm.fun[name]
            if (!fn) {
                vm.command.print(name + ' - unknown command')
            } else {
                let def = name
                if (fn.usage) def += ' ' + fn.usage
                if (fn.man) def += ' - ' + fn.man
                vm.command.print(def)
            }

        } else {
            Object.keys(vm.command).forEach(cmd => {
                if (cmd.startsWith('_')) return
                const obj = vm.command[cmd]
                if (typeof obj !== 'function' || obj.service) return
                vm.command.print(cmd + ' ', { semi: true })
            })
            Object.keys(vm.fun).forEach(fn => {
                if (fn.startsWith('_')) return
                const obj = vm.fun[fn]
                if (typeof obj !== 'function' || obj.service) return
                vm.command.print(fn + '() ', { semi: true })
            })
            vm.command.print('')
        }
    },

    env: function(fn) {
        const vm = this
        Object.keys(vm.scope).forEach(key => {
            let val = vm.scope[key]
            if (typeof val === 'string') {
                val = '"' + val + '"'
            }
            vm.command.print(key + '=' + val + ' ', { semi: true })
        })
        vm.command.print('')
    },

    list: function(from, to) {
        this.command.print(this.source(from, to))
    },

    listo: function(to) {
        this.command.print(this.source(0, to))
    },

    'new': function() {
        this.clearScope()
        this.clearSource()
    },

    clr: function() {
        this.clearScope()
    },

    run: function(n) {
        const lex = this.lexFromSource(
                this.source(), this.command.print)
        const code = this.parse(this, lex)

        if (n) {
            // run from a label
            const label = this.label[n]
            if (label) {
                this.code = label.block.code
                this.pos  = label.pos
                return
            }
        }
        this.run(code, 0)
    },

    poke: function(n, v) {
        this.util.expectInteger(n)
        this.util.expectInteger(v)
        if (v < 0) v = 0
        if (v > 255) v = 255
        this.ram[n || 0] = v || 0
    },

    sleep: function (n) {
        this.interrupt()
        this.resumeOnTimeout = true

        const vm = this
        setTimeout(() => {
            if (this.resumeOnInput || this.resumeOnTimeout) {
                this.interrupted = false
                this.resumeOnTimeout = false
                vm.resume()
            }
        }, (n * 1000)|0)
    },
}

core.help.usage = '(name)'
core.help.man = 'list all commands and functions\n'
        + '              or show help for [name]'

core.env.man = 'list all defined variables with their values'

core.list.usage = '(from), (to)'
core.list.man = 'list basic source'

core.listo.usage = '(to)'
core.listo.man = 'list basic source up to the specified line'

core['new'].man = 'erase current program'

core.clr.man = 'erase all defined variables'

core.poke.usage = '(address), (value)'
core.poke.man = 'set memory cell at [address] to [value]'

core.sleep.usage = 'n'
core.sleep.man = 'wait for [n] seconds'

if (module) {
    module.exports = core
} else {
    this.jbas? this.jbas.core = core : this.jbas = {
        core
    }
}
