$(function () {
    $('.playlist-delete').mousedown(showDeleteDialog);
    $('.playlist-create').mousedown(showCreateDialog);
    $('.playlist-package').mousedown(showPackageDialog);

    // sendinfo controller
    /*
    $('.playlist-package-dialog .btn-primary').click(function (e) {
        e.preventDefault();
        $.post('/download/playlist/',
            $('.playlist-package-dialog form').serialize(),
            function(response){
                $('.playlist-package-dialog').modal('hide');
                // add to mainwindow playlist sidebar
                alert("Playlist downloaded successfully");
            }
        );

    }); */

});


function showDeleteDialog() {
    $('.playlist-delete-dialog .delete-title').text($(this).attr('plname'));
    $('.playlist-delete-dialog input').val($(this).attr('plid'));
    $('.playlist-delete-dialog').modal();
}

function showCreateDialog() {
    $('.playlist-create-dialog input[type="text"]').val('');
    $('.playlist-create-dialog').modal();
}

function showPackageDialog(e) {
    $('.playlist-package-dialog').modal();

}
