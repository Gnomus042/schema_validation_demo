let currText = "";

$("#validate-btn").on('click', async () => {
    $('.output-block').empty();
    currText = $("#input-text").val();
    $("#validate-btn").addClass('disabled');
    await parse(currText);
});

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

$('#input-text').keyup(() => {
   if ($(this).text() !== currText) {
       $("#validate-btn").removeClass('disabled');
   }
});

function dataItemLayout(predicate, object, indent) {
    let trueIndent = indent * 30;
    return `<div class="data-item">
        <div class="info">
            <div class="predicate"><div style='width: ${trueIndent}px'></div><div>${predicate}</div></div>
            <div class="object">${object}</div>
        </div>
    </div>`;
}

function failureLayout(failure, type) {
    let services = failure.services.map(x => `<img class="service-icon" src="static/images/services/${x}.png" alt="${x}"/>`).join('')
    return `<div class="failure ${type}">
        <div class="property">
            <img src="static/images/icons/${type}.svg" alt="${type}">
            <div>${clearURL(failure.property)}</div>
        </div>
        <div class="message">${clearURL(failure.message)}</div>
        <div class="services">${services}</div>
    </div>`
}

function addReport(type, report, dataItems) {
    let errors = report.filter(x => x.severity === 'error');
    let warnings = report.filter(x => x.severity === 'warning');
    let id = $('.report').length;
    let reportLayout = `
        <div class="report" id="report-${id}">
            <div class="title">
                <div><b>${type}</b></div>
                <div class="error"><span id="errors-count">${errors.length}</span> errors</div>
                <div class="warning"><span id="warnings-count">${warnings.length}</span> warnings</div>
            </div>
            <div class="data-items">${dataItems.join('')}</div>
            <div class="errors">${errors.map(x => failureLayout(x, x.severity)).join('') +
    warnings.map(x => failureLayout(x, x.severity)).join('')}</div>
        </div>
    `;
    $('.output-block').append(reportLayout);
    $( `#report-${id}>.title` ).on( "click", function() {
      $(this).parent().find('.errors').toggle();
      $(this).parent().find('.data-items').toggle();
    });
}