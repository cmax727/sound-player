// add to playlist dialog
$(function () {

    $('.music-control-addtopl').mousedown(function () {
        var trackid = $('.music-track-table .selected').attr('trackid');
        var title = $('.music-track-table .selected td:nth-child(1)').text();

        $('.music-dialog-addtopl .track-id').val(trackid);
        $('.music-dialog-addtopl .track-title').text(title);

        if ($('.music-dialog-addtopl option').length > 0) {
//            $('.music-dialog-addtopl').modal();
            $('#dialog_addtopl').modal();
        }
    });


    $('#dialog_addtopl .btn-success').mousedown(function () {
        var trackid = $('.music-dialog-addtopl .track-id').val();
        var plid = $('.music-dialog-addtopl select').val();
        if ( plid != "_"){
            $.post('/playlist/addtrack', {
                trackid:  trackid,
                playlistid: plid

            });
            $('#dialog_addtopl').modal('hide');
        }else{
            $('.playlist-create-dialog').modal();
        }

    });
});

// create a new playlist


$(function () {
    $('.playlist-create-dialog .btn-primary').click(function () {
        $.post('/playlist/create',
            {name:  $("#pl_name").val(),type:"ajax"},
            function(response){
                $('.music-dialog-addtopl select option').eq(-2).after("<option value='"+response.newid +"'>"+response.name +"</option>")
                $('.playlist-create-dialog').modal('hide');
                // add to mainwindow playlist sidebar
                $("ul.s-playlist").append("<li><a href= '"+response.newid +"'>"+response.name +"</a></option>");
            }
        );

    });


    // button send controller
    $('#dialog_downloadtrack .btn-primary').click(function (e) {
        e.preventDefault();
        $.post('/download/track/' + trackdata['id'],
            $('#dialog_downloadtrack form').serialize(),
            function(response){
                $('.music-dialog-addtopl select option').eq(-2).after("<option value='"+response.newid +"'>"+response.name +"</option>")
                $('#dialog_downloadtrack').modal('hide');
                // add to mainwindow playlist sidebar
                alert("File downloaded successfully");
            }
        );

    });

});