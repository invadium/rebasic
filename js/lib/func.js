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
func.peek.tags = 'core, classic'

func.time.usage = ''
func.time.man = 'return current time in milliseconds'
func.time.tags = 'core'

module.exports = func
