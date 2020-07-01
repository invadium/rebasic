const core = {
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
}

if (module) {
    module.exports = core
} else {
    this.jbas? this.jbas.core = core : this.jbas = {
        core
    }
}
