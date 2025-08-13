const func = {

    peek: function(n) {
        this.util.expectInteger(n)
        return (this.ram[n] || 0)
    },

    time: function() {
        return Date.now()
    },
}

func.peek.usage = 'address'
func.peek.man = 'get content of memory at [address]'

func.time.usage = ''
func.time.man = 'return current time in milliseconds'

module.exports = func
