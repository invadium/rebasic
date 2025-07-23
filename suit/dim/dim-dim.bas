10 dim v(4)
20 for i = 1 to 4
30   dim w(4)
40   v(i) = w
44   for j = 1 to 4
45     v(i:j) = i * 100 + j
48   next j
50 next i

100 print v

210 print v(1:1); " <=> 101"
220 print v(1:4); " <=> 104"
230 print v(2:1); " <=> 201"
240 print v(2:3); " <=> 203"
250 print v(2:4); " <=> 204"
260 print v(3:1); " <=> 301"
270 print v(3:4); " <=> 304"
280 print v(4:1); " <=> 401"
290 print v(4:4); " <=> 404"
