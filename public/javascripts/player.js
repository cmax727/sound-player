var playing = false;
var movingMarker = true;
var trackdata = null;
var paused = true;
var fastMoving = false;
function resizeScrubber() {
    var width = $(".music-wave-holder").width();
    $('.music-wave-off, .music-wave-on').css('width', width + "px");
}


$(function () {
    soundManager.setup({
        url: '/javascripts/soundmanagerv297a-20121104/swf',
        flashVersion: 9, // optional: shiny features (default = 8)
        useFlashBlock: false, // optionally, enable when you're ready to dive in
        debugMode: false,
        onready: function () {
            // Prime the audio player...
            trackdata = _.first(audioTracks);
            setPlayerGUI(_.first(audioTracks));

            $('.music-track-table tr[trackid]').first().addClass('selected');
        }
    });
    soundManager.load('audioTrack');
    // Clicking on a track table item plays it...
    $('tr.track-row td:not(:nth-child(8n+0))').click(function () {
        $('.music-track-table tr').removeClass('selected');
        $(this).parent().addClass('selected');
        playTrack($(this).parent().attr('trackid'));
    });

    // Resizing the wave scrubber
    var handler = 0;
    $(window).resize(function () {
        if (handler) {
            clearTimeout(handler);
        }

        handler = setTimeout(resizeScrubber, 150);
    });
    resizeScrubber();

    // Activate functionality of the wave scrubber
    $('.music-wave-holder').mousemove(function (e) {
        movingMarker = false;

        var markerpct = (e.pageX - this.offsetLeft);
        $('.music-wave-marker').css('left', markerpct-10 + "px");
    });

    $('.music-wave-holder').mouseout(function () {
        movingMarker = true;
    });

    $('.music-wave-holder').mousedown(function (e) {
        var sound = soundManager.getSoundById('audioTrack');
        var holderw = $(".music-wave-holder").width();
        var markerms = (e.pageX - this.offsetLeft) * sound.durationEstimate / holderw;

        soundManager.setPosition('audioTrack', markerms);
    });

    // Stings only have one handler for all tracks...
    $('.music-control-sting').mousedown(function () {
        var sound = soundManager.getSoundById('audioTrack');
        widthPro = 100 *  8000 / sound.durationEstimate;
        if ( widthPro > 40)
            pSting = sound.durationEstimate * 60/100;
        else{
            pSting = sound.durationEstimate-8000;
        }
        soundManager.setPosition('audioTrack', pSting);
    });

    // And the previous/next track buttons
    $('.music-control-prevtrack').click(function(e){
        if ( !fastMoving){
            playPrevTrack(e)
        }
        fastMoving = false;
    });
    $(document).bind('keydown', 'left', playPrevTrack);

    $('.music-control-nexttrack').click(function(e){
        if ( !fastMoving){playNextTrack(e)}
        fastMoving = false;
    });
    $(document).bind('keydown', 'right', playNextTrack);

    $('.music-control-nexttrack').mousehold(function(i){
            if ( i>3)
                playMoveForward();
        }
//        , function(){fastMoving = false;}
    );
    $('.music-control-prevtrack').mousehold(function(i){
            if ( i>3)
                playMoveBackward();
        }
//        , function(){fastMoving = false;}
    );

    // So does the play/pause button
    $('.music-control-playpause').click(playPause);
    $(document).bind('keydown', 'space', playPause)


    // Stems
    $('.music-control-stems').click(function () { return false; });
    $('.music-control-stems').mousedown(function () {
       window.location = '/stems/' + trackdata.id; 
    });

    // Comments
    $(".music-control-comments").mousedown(function () {
        window.location = "/comments/" + trackdata.id;
    });
    // download handler
    $('#music_download').click(function (e) {
        //window.open("/download/track/" + trackdata.id, "download");
        var pagetitle = "Music Download";
        var $dialog = $('#dialog_downloadtrack').modal();
        $("#dialog_downloadtrack form").attr("action", "/download/track/" + trackdata.id );
        $("#dl-title").html(trackdata.track_title);
        $("#dl-trackid").val(trackdata.id);
        $("#dl-link-mp3").attr('href', "/download/transfer/track/" + trackdata.id + "/0");
        $("#dl-link-aiff").attr('href', "/download/transfer/track/" + trackdata.id + "/1");

    });

    //favorite handler
    $('.music-control-favorite-player').mousedown(function () {
        var that = this;
        $selected = $('.music-track-table tbody tr.selected td:last-child img');
        $.post("/playlist/togglefavorite", {
            "trackid": trackdata.id
        }, function (resp) {
            if (resp == 1) {
                $(that).attr("src", "/images/icon-favorite-on.png");
                $selected.attr("src", "/images/icon-favorite-on.png");
            } else {
                $(that).attr("src", "/images/icon-favorite-off.png");
                $selected.attr("src", "/images/icon-favorite-off.png");
            }
        }, "json");
    });

    //stem listing
    $(".music-control-stemlist").click(function(e){
        if ( $(this).attr('stem')  == 1)
            document.location.href ="/stems/" + trackdata.id;

    });

    // table sort
    $(".music-track-table").tablesorter();

});


function playPause() {
    if (!paused && playing) {
        soundManager.pause('audioTrack');
        paused = true;

    } else {
        if (playing) {
            soundManager.resume('audioTrack');
            paused = false;

        } else {
            playTrack(_.first(audioTracks).id, true);
        }
    }


    return false;
}

function playNextTrack() {
    var i = $('.music-track-table tr.selected').index('tr:visible');
    var nextVisible = $('.music-track-table').find('tr:visible').eq(i+1);


//    var next = $('.music-track-table tr.selected').next();
    next = nextVisible;
    if (next.length > 0) {
        $('.music-track-table tr').removeClass('selected');
        $(next).addClass('selected');

        var play = $(next).attr('trackid');
        playTrack(play);
    }else{
        // move to first track and stop it
        $('.music-track-table tr').removeClass('selected');
        $('.music-track-table tr:first-child').addClass('selected');

        playTrack(_.first(audioTracks).id);
        playPause()
    }
}

function playMoveForward() {
    sound = soundManager.getSoundById('audioTrack');
    fastMoving = true;
    newpos = sound.position + 800;
    if ( newpos >= sound.durationEstimate)
        newpos = sound.durationEstimate;
    sound.setPosition(newpos);
}

function playMoveBackward() {
    fastMoving = true;
    sound = soundManager.getSoundById('audioTrack');
    newpos = sound.position - 800;
    if ( newpos <= 0)
        newpos = 0
    sound.setPosition(newpos);
}

function playPrevTrack() {
    var i = $('.music-track-table tr.selected').index('tr:visible');
    var prevVisible = $('.music-track-table').find('tr:visible').eq(i-1);

//    var previous = $('.music-track-table tr.selected').prev();
    previous = prevVisible;
    if (previous.length > 0) {
        $('.music-track-table tr').removeClass('selected');
        $(previous).addClass('selected');

        var play = $(previous).attr('trackid');
        playTrack(play);
    }
}


function setPlayerGUI(trackdata) {
    paused = false;
    playing = false;
    
    // Nerf previous track
    soundManager.destroySound('audioTrack');

    if (!trackdata) {
        // No track data, so nothing more we can do...
        return;
    }

    // Init new track into SM2
    soundManager.createSound({
        id: 'audioTrack',
        url: '/audio_files/' + trackdata['track_title'] + ".mp3",
        autoLoad: true,
        onload: function(success){
          if ( success){
              sound = soundManager.getSoundById('audioTrack');
              widthPro = 100 *  8000 / sound.durationEstimate;
              if ( widthPro > 40)
                widthPro = 40;
              $(".music-wave-sting-holder").width(widthPro + "%");
              $(".music-wave-error-holder").hide();
          }else{
              $(".music-wave-error-holder").show();
              $(".music-wave-sting-holder").width(0);
          }
        },
        onfinish: function(){
            soundManager.destroySound('audioTrack');
            playNextTrack();
        }
    });

    // Update UI


    $('.music-track-title').text(trackdata['track_title_pretty']);
    $('.music-track-length').text(trackdata['length_pretty']);
    $('.music-type').text(trackdata['type']);

    if (trackdata.stems > 0) {
        $('.music-track-stems').html($("<a></a>").attr("style", "color: #999 !important;").attr("href", "/stems/" + trackdata.id).text("Yes (Show)"));
        $(".music-control-stemlist").attr('src', "/images/control-track-stem-on.png").attr('stem', 1);

    } else {
        $(".music-track-stems").text("No");
        $(".music-control-stemlist").attr('src', "/images/control-track-stem-off.png").attr('stem', 0);
    }

    
    $(".music-track-tempo").text(trackdata.tempo);
    $(".music-track-mood").text(trackdata.mood);


//    var offname = escape(trackdata.track_title + "-off.png");
//    var onname = escape(trackdata.track_title + "-on.png");
    var offname = encodeURI(trackdata['wave-off']);
    var onname = encodeURI(trackdata['wave-on']);

    $('.music-wave-on-holder').css('width', "0px");

    $('.music-wave-off').attr('src', "/audio_images/" + offname);
    $('.music-wave-on').attr('src', '/audio_images/' + onname);


       
    //});

    $.get("/ratings/" + trackdata.id, function (rating) {
        setRatingValue(rating);
    });

    $.get("/playlist/getfavorite/" + trackdata.id, function (resp) {
        if (resp == 1) {
            $(".music-control-favorite-player").attr("src", "/images/icon-favorite-on.png");
        } else {
            $(".music-control-favorite-player").attr("src", "/images/icon-favorite-off.png");
        }
    });


}

function playTrack(id, nogui) {
    trackdata = _.find(audioTracks, function (t) { return t.id == id; });

    if (!trackdata) {
        // No track data to be found... abort
        return;
    }

    if (!nogui) {
        setPlayerGUI(trackdata);
    }


    // And... play!
    soundManager.play('audioTrack', {
        whileplaying:function() {
            var pct = (this.position / this.durationEstimate);
            var total = $(".music-wave-holder").width();
            var width = parseInt(pct*total);

            $('.music-wave-on-holder').css('width', width + "px");

            if (movingMarker) {
                $('.music-wave-marker').css('left', width-10 + 'px');
            }
        }
    });

    playing = true;
}


