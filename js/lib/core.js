const core = {
    list: function() {
        this.command.print(this.source())
    },


    'new': function() {
        this.lines = []
        this.lastLine = 0
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
