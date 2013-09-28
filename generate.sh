#!/bin/bash

base=`basename "$1" .mp3`

sox "$1" "$1.wav"
#sndfile-waveform --no-peak -B 0xFFF8F8F8 -R 0xFF0088CC -g 1200x72 "$1.wav" "$base-on.png"
#sndfile-waveform --no-peak -B 0xFFFFFFFF -R 0xFFE0E0E0 -g 1200x72 "$1.wav" "$base-off.png"

wav2png --background-color d6d9dbff --foreground-color 808080FF -w 1200 -h 82 -o "$2/$base-off.png" "$1.wav"
wav2png --background-color 82b8d3ff --foreground-color 4c819fff -w 1200 -h 82 -o "$2/$base-on.png" "$1.wav"


rm "$1.wav"

