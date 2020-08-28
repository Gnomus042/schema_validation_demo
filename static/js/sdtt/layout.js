$("#validate-btn").on('click', () => parse($("#input-text").val()));

$(document).bind('keypress', function (e) {
    if (e.keyCode === 10 && e.ctrlKey) {
        $("#validate-btn").click();
    }
});

$(document).delegate('#input-text', 'keydown', function (e) {
    var keyCode = e.keyCode || e.which;

    if (keyCode === 9) {
        e.preventDefault();
        var start = this.selectionStart;
        var end = this.selectionEnd;

        $(this).val($(this).val().substring(0, start)
            + "\t"
            + $(this).val().substring(end));

        this.selectionStart =
            this.selectionEnd = start + 1;
    }
});


function addDataItem(predicate, object, indent) {
    let trueIndent = indent*30;
    $(".data-items").append(`<div class="data-item">
        <div class="info">
            <div class="predicate"><div style='width: ${trueIndent}px'></div><div>${predicate}</div></div>
            <div class="object">${object}</div>
        </div>
    </div>`);
}