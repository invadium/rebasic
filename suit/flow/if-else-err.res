Block {
  lex: {
    next: [Function: next],
    ahead: [Function: ahead],
    expect: [Function: expect],
    ret: [Function: ret],
    skipLine: [Function: skipLine],
    err: [Function: err],
    dumpLine: [Function: dumpLine],
    SYM: 1,
    NUM: 2,
    STR: 3,
    OPERATOR: 4,
    KEYWORD: 5
  },
  code: [
    {
      type: 1,
      val: 'print',
      pos: 8,
      line: 1,
      toString: [Function: toString],
      opt: [Object]
    },
    {
      type: 2,
      lval: 'v',
      rval: [Object],
      pos: 6,
      line: 2,
      toString: [Function: toString]
    }
  ]
}
30 if v < 10 then print "OK" stop
                             ^
3.30: unexpected command: [stop]
