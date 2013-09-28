#!/bin/bash

IFS=`echo -ne "\n\b"`
for fn in `ls *.mp3`; do
    len=`soxi -D $fn`
    query="UPDATE tracks SET length=$len WHERE track_title=\"$fn\" ;"

#    echo $fn
 #   echo $query | mysql -u root -pkakica123 music
    echo $query;
done
