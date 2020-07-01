const func = {

    peek: function(n) {
        this.util.expectInteger(n)
        return (this.ram[n] || 0)
    },

}

module.exports = func
