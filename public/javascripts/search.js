function filterPage(){
//        $('form').submit();
}

$(function () {
    // do filter
    $('.music-track-table').columnFilters();
    $(".music-track-table thead tr").eq(1).hide();

    // tie filter to filterOptions controls
    $('.search-filter-genre').change(function () {
        $('#_filterText1').val($(this).val());
        $('#_filterText1').trigger('keyup', 'left');
    });
    $('.search-filter-instrument').change(function () {
        $('#_filterText4').val($(this).val());
        $('#_filterText4').trigger('keyup', 'left');
    });

    $('.search-filter-tempo').change(function () {
        $('#_filterText6').val($(this).val());
        $('#_filterText6').trigger('keyup', 'left');
    });

    $('.search-filter-type').change(function () {
        $('#_filterText2').val($(this).val());
        $('#_filterText2').trigger('keyup', 'left');
    });


});

