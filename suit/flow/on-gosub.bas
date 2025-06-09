10 let opt = 2
20 on opt gosub 100, 200, 300
30 print "back from gosub"
40 stop

100 print "at 100"
110 return

200 print "at 200"
210 return

300 print "at 300"
310 return
