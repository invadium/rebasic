function src(lines) {
    return lines.filter(l => l).join('\n')
}

const core = {
    list: function() {
        this.command.print(src(this.lines))
    },

    'new': function() {
        this.list = []
        this.lastLine = 0
    },

    run: function() {
        const lex = this.lexFromSource(
                src(this.lines), this.command.print)
        const code = this.parse(this, lex)
        this.run(code, 0)
    },

    exit: function() {
        this.command.close()
    }, 
}

if (module) {
    module.exports = core
} else {
    this.jbas? this.jbas.core = core : this.jbas = {
        core
    }
}
