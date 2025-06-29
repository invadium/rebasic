10 print "testing the positive if-goto-else branch"
20 let v = 5
30 if v < 10 goto 100 else 900
40 print "we should never get here!"
50 stop

100 print "got the positive jump!"
110 print "now testing the negative if-goto-else branch"
120 if v > 10 goto 900 else 200
130 print "we should never get here!"
140 stop

200 print "got the negative jump!"
210 print "success!"
220 stop

900 print "we should never get here!"
910 end
