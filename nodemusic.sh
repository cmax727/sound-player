#!/bin/bash
# nohup node admin.js &

cd /var/www/websites/stplayer/web/mzk/music_2/
forever stop admin.js
forever start admin.js

