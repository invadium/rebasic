const func = {

    peek: function(n) {
        this.util.expectInteger(n)
        return (this.ram[n] || 0)
    },

}

func.peek.usage = 'address'
func.peek.man = 'get content of memory at [address]'

module.exports = func
