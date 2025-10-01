const str = {
    asc: function(s) {
        if (!s) return 0
        return s.charCodeAt(0)
    },
    chr$: function(c) {
        return String.fromCharCode(c || 0)
    },
    len: function(s) {
        if (!s) return 0
        if (s instanceof this.Dim) {
            return s.len
        } else if (s instanceof this.Map) {
            return s.getLength()
        } else {
            return s.length
        }
    },
    left$: function(s, i) {
        if (!s) return ""
        return s.substring(0, i)
    },
    mid$: function(s, i, j) {
        if (!s) return ""
        return s.substring(i, j)
    },
    right$: function(s, i) {
        if (!s) return ""
        return s.substring(i)
    },
    str$: function(x) {
        return '' + x
    }, 
    val: function(s) {
        if (!s) return 0
        const v = parseInt(s)
        if (isNaN(v)) return 0
        return v
    },
    spc: function(n) {
        let res = ''
        for (let i = 0; i < n; i++) res += ' '
        return res
    },
    tab: function(n) {
        let res = ''
        for (let i = 0; i < n; i++) res += '\t'
        return res
    },
}

str.asc.usage = '(s$)'
str.asc.man = 'ASCII code of the first character'
str.asc.tags = 'core, classic, string'

str.chr$.usage = '(x)'
str.chr$.man = 'character for ASCII code of [x]'
str.chr$.tags = 'core, classic, string'

str.len.usage = '(s$)'
str.len.man = 'length of the string [s$]'
str.len.tags = 'core, classic, string'

str.left$.usage = '(s$,x)'
str.left$.man = 'get left [x] characters of [s$]'
str.left$.tags = 'core, classic, string'

str.mid$.usage = '(s$,n,m)'
str.mid$.man = 'characters of s$ from [n] to [m]'
str.mid$.tags = 'core, classic, string'

str.right$.usage = '(s$,x)'
str.right$.man = 'get right [x] characters of [s$]'
str.right$.tags = 'core, classic, string'

str.str$.usage = '(x)'
str.str$.man = 'convert [x] into a string'
str.str$.tags = 'core, classic, string'

str.val.usage = '(s$)'
str.val.man = 'convert s$ into a number'
str.val.tags = 'core, classic, string'

str.spc.usage = '(n)'
str.spc.man = 'string of [n] spaces'
str.spc.tags = 'core, classic, string'

str.tab.usage = '(n)'
str.tab.man = 'string of [n] tabs'
str.tab.tags = 'core, classic, string'


if (module) {
    module.exports = str
} else {
    this.jbas? this.jbas.str = str : this.jbas = {
        str
    }
}
