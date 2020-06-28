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

}

if (module) {
    module.exports = core
} else {
    this.jbas? this.jbas.core = core : this.jbas = {
        core
    }
}
