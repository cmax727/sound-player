$(function () {

    $('.music-track-table tbody td:last-child').click(function (e) {
    //$('.music-control-favorite').click(function (e) {
        var trackid = $(this).parent().attr('trackid');
        var that = $(this).find("img");
        var isCurrent = $(this).parent().hasClass('selected');

        $.post('/playlist/togglefavorite', {
            trackid: trackid
        }, function (resp) {
            if (resp == 1) {
                $(that).attr("src", "/images/icon-favorite-on.png");
                if ( isCurrent) {$(".music-control-favorite-player").attr("src", "/images/icon-favorite-on.png");}

            } else {
                $(that).attr("src", "/images/icon-favorite-off.png");
                if ( isCurrent) {$(".music-control-favorite-player").attr("src", "/images/icon-favorite-off.png");}
            }
        });
    });
});
