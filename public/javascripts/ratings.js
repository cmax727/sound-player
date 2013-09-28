$(function () {
    $(".music-ratings .music-control").mousedown(function () {
        var index = $(this).index() + 1;

        $.post("/ratings/rate/" + trackdata.id, {
            "rating": index
        }, function () {
            setRatingValue(index);
        });
    });
});


function setRatingValue(r) {
    $(".music-ratings img").each(function (i, e) {
        $(e).attr("src", i<r ? "/images/star-on.png" : "/images/star-off.png"); 
    });
}

