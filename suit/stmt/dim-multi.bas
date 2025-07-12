10 dim a(2,3)
30 print a

40 a(1, 1) = 11
50 a(1, 2) = 12
60 a(1, 3) = 13
70 a(2, 1) = 21
80 a(2, 2) = 22
90 a(2, 3) = 23
99 print a

100 for i = 1 to 2
110   for j = 1 to 3
120     print i;",";j;":",a(i, j)
150   next j
160 next i

200 for i = 1 to 2
210   for j = 1 to 3
220     a(i, j) = "@" + i + ":" + j
230   next j
240 next i
250 print a
