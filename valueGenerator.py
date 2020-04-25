#!/usr/bin/env python3

import argparse
import sys
import csv

def calcValues(starting,end,cash,stock):
    end=int(end)
    cash=int(cash)
    starting=int(starting)
    n=starting
    valsForFile=[['Date','Open','Close']]
    print(stock)
    with open("stockResults.csv",'w',newline='') as f:
        thewriter=csv.writer(f)
        thewriter.writerow(['Date','Open','Close'])
        if (stock =="microsoft"):
            while n<end+1:
                val=cash*pow(n,1.5)
                thewriter.writerow([n,'blank',round(val,2)])
                n=n+1
        elif(stock=="amazon"):
            while n<end+1:
                val=cash*(pow(n,1.8)/100)
                thewriter.writerow([n, 'blank',round(val,2)])
                n=n+1


if __name__=='__main__':
    initialDay=sys.argv[1]
    finalDay=sys.argv[2]
    initialCash=sys.argv[3]
    stock=sys.argv[4]
    print(initialDay)
    print(initialCash)
    print(finalDay)
    print(stock)
    calcValues(initialDay,finalDay,initialCash,stock)