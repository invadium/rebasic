10 read val
20 print val
30 if val <> "done" goto 10
40 stop

1000 data 1
1010 data 21, 22, 23, 24
1020 data "word"
1030 data "a single quoted phrase"
1040 data "data string 1", "data string 2"
1050 data rawOnly
1060 data single multi word raw entry
1070 data rawMore, raw value, another raw value, yet another raw value
1991 data "done"

