$(function () {
    $('.control-remove').removeClass('hide').mousedown(function () {
        var trackid = $(this).parent().parent().attr('trackid');

        $('.track-removefrompl .track-id').val(trackid);
        $('.track-removefrompl .playlist-id').val(thisPlaylistId);

        $('.track-removefrompl').modal();
    });
});
