#!/bin/bash

IFS=`echo -ne "\n\b"`
for fn in `ls *.mp3`; do
    base=`basename $fn .mp3`

    if [ ! -f "$base.aiff" ]; then
        echo Converting $fn
        sox "$fn" "$base.aiff"
    fi
done
