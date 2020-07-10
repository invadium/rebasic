const core = {

    help: function(name) {
        const vm = this
        console.dir(name)

        // normalize possible id object
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
                vm.command.print(cmd + ' ', { semi: true })
            })
            Object.keys(vm.fun).forEach(f => {
                vm.command.print(f + '() ', { semi: true })
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

    'new': function() {
        this.clearScope()
        this.clearSource()
    },

    clr: function() {
        this.clearScope()
    },

    run: function() {
        const lex = this.lexFromSource(
                this.source(), this.command.print)
        const code = this.parse(this, lex)
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
        this.interrupt(false)

        const vm = this
        setTimeout(() => {
            this.interrupted = false
            vm.resume()
        }, (n * 1000)|0)
    },
}

core.help.usage = '(name)'
core.help.man = 'list all commands and functions\n'
        + '              or show help for [name]'

core.env.man = 'list defined variables and their values'

core.list.usage = '(from) (to)'
core.list.man = 'list basic source'

core['new'].man = 'erase existing program'

core.clr.man = 'clean up defined variables'

core.sleep.usage = 'n'
core.sleep.man = 'wait for [n] seconds'

if (module) {
    module.exports = core
} else {
    this.jbas? this.jbas.core = core : this.jbas = {
        core
    }
}
