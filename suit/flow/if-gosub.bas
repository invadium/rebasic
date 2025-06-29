10 print "testing if-gosub control flow"

20 let v = 5
30 if v < 10 gosub 100
40 print "back in the main flow"

50 print "now try to branch on a label"
60 if v < 20 gosub reportLess
70 print "back in the main flow"
80 stop

100 print "reporting the value < 10 from a subroutine!"
110 return

reportLess:
    print "reporting the value < 20 from a subroutine!"
    return

print "we should never get here!"
