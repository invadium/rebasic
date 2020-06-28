const core = {
    list: function() {
        this.command.print(this.source())
    },


    'new': function() {
        vm.clearScope()
        vm.clearSource()
    },

    clr: function() {
        vm.clearScope()
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
