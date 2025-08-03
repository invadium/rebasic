10 print "testing if-gosub-else branching"
20 let v = 5

25 print "test the positive case"
30 if v < 10 gosub 200 else 900
40 print "back in the main flow"

50 print "test the negative case"
60 if v > 20 gosub 900 else 300
70 print "back in the main flow"

100 print "test the positive case with labels"
110 if v < 30 gosub less30 else impossible
120 print "back in the main flow"

130 print "test the negative case with labels"
140 if v > 40 gosub impossible else notMore40
150 print "back in the main flow"
160 print "success!"
170 stop


less30:
    print "reporting the value is less than 30 from a labeled subroutine!"
    return

notMore40:
    print "reporting the value is not more then 40 from a labeled subroutine!"
    return


200 print "reporting the value is less then 10 from a subroutine!"
210 return

300 print "reporting the value is no more than 20 from a subroutine!"
310 return

impossible:
    print "we should never get here!"
    return

900 print "we should never get here!"
910 return
920 end
