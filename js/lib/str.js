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
        return s.length
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
    val$: function(s) {
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

if (module) {
    module.exports = str
} else {
    this.jbas? this.jbas.str = str : this.jbas = {
        str
    }
}
