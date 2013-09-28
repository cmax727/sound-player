#!/bin/bash

base=`basename "$1" .mp3`

if [ ! -f "$2/$base.aiff" ]; then
    echo Converting $1
    sox "$1" "$2/$base.aiff"
fi
