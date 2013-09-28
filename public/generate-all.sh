#!/bin/bash

IFS=`echo -ne "\n\b"`
for fn in `ls *.mp3`; do
	./generate.sh $fn $1
done


