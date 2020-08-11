$('#validate-btn').on('click', () => {
    let data = JSON.parse($('#text-data-input').val());
    $('.report-cell').addClass('d-none');
    validate(data);
});

$(document).bind('keypress', function (e) {
    if (e.keyCode === 10 && e.ctrlKey) {
        $("#validate-btn").click();
    }
});

$('#file-data-input').change(() => {
    let file = $("#file-data-input").get(0).files[0];
    $("label[for=file-data-input]").text(file.name);
    readTextFromFile(file).then(text => $("#text-data-input").val(text));
});

$(document).delegate('#text-data-input', 'keydown', function (e) {
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

function readTextFromFile(file) {
    let resolver;
    let promise = new Promise((res, rej) => {
        resolver = res
    });
    let onReaderLoad = (event) => {
        resolver(event.target.result);
    };
    let reader = new FileReader();
    reader.onload = onReaderLoad;
    reader.readAsText(file);
    return promise;
}

function initTests(tests) {
    tests.forEach((test, idx) => {
        $('.tests').append(`<div class="btn btn-light">Test ${idx + 1}</div>`);
        $('.tests>div').eq(idx).on('click', evt => {
            $("#text-data-input").val(test);
            $('.tests>div').removeClass('btn-dark');
            $(evt.target).addClass('btn-dark');
        });
    });
}

function prepareValidationTable() {
    let tbody = $("#results-table tbody");
    supportedServices.forEach((service, idx) => {
        tbody.append(`
            <tr>
                <th scope="row">
                    <div class="header-cell">
                        <img src="static/images/icons/expand_more.svg" alt="expand" id="expand-${service}">
                        <img src="static/images/icons/expand_less.svg" class="d-none" alt="hide" id="hide-${service}">
                        <div>${service}</div>
                    </div> 
                </th>
                <td>
                    <div class="report-cell d-none">
                        <div class="mandatory">
                            <div class="errors">Errors: <span></span></div>
                            <div class="warnings">Warnings: <span></span></div>
                        </div>
                        <div class="details d-none"></div>
                    </div>
                </td>
                <td>
                    <div class="report-cell d-none">
                        <div class="mandatory">
                            <div class="errors">Errors: <span></span></div>
                            <div class="warnings">Warnings: <span></span></div>
                        </div>
                        <div class="details d-none"></div>
                    </div>
                </td>
            </tr>
        `);
        let exp = () => {
            let row = $('tbody tr').eq(idx);
            row.find('.details').toggleClass('d-none');
            row.find('th img').toggleClass('d-none');
        };
        $(`#expand-${service}`).on('click', exp);
        $(`#hide-${service}`).on('click', exp);
    });
}

function fillValidationTable(report) {
    let reportCells = $('.report-cell');
    supportedServices.forEach((service, idx) => {
        let specReport = report.get(service);

        if (specReport.shex) {
            fillSpecReport(specReport.shex, reportCells.eq(idx * 2));
        }
        if (specReport.shacl) {
            fillSpecReport(specReport.shacl, reportCells.eq(idx * 2 + 1));
        }
    })
}

function fillSpecReport(specReport, reportCell) {
    reportCell.removeClass('d-none');

    let errors = specReport.filter(x => x.severity === 'error');
    let warnings = specReport.filter(x => x.severity === 'warning');

    reportCell.find('.errors>span').text(errors.length);
    reportCell.find('.warnings>span').text(warnings.length);
    fillDetails(errors, warnings, reportCell.find('.details'));
}

function fillDetails(errors, warnings, detailsField) {
    detailsField.empty();
    fillDetailsItems(errors, detailsField, 'error');
    fillDetailsItems(warnings, detailsField, 'warning');
}

function fillDetailsItems(items, detailsField, type) {
    items.forEach(item => {
            let property = item.property ? `<div>${item.property.replace('http://schema.org/', 'schema:')}</div>`: "";
            let url = item.url ? `<a class="btn btn-light" href="${item.url}">Details</a>` : '';
            let message = item.message ? `<div><span>Message:</span> ${item.message.replace('<', '').replace('>', '')}</div>` : '';
            let description = item.description ? `<div><span>Description:</span>${item.description}</div>` : '';
            detailsField.append(`
                <div class="details-item ${type}-item">
                    <div class="head">
                        ${property}
                        ${url}
                    </div>
                    <div class="info">
                        ${description}
                        ${message}
                    </div>
                </div>
            `);
        }
    )
}


// shape viewer

function initServiceSelect() {
    let select = $("#service-select")
    supportedServices.forEach(service => {
        select.append(`<option value="${service}">${service}</option>`)
    });
    changeDisplayedShape();
}

$("#service-select").change(changeDisplayedShape);
$("#language-select").change(changeDisplayedShape);
$("#type-select").change(changeDisplayedShape);

function changeDisplayedShape() {
    let lang = $("#language-select").val();
    let type = $("#type-select").val();
    let service = $("#service-select").val();
    $.get(`shape/${lang}/${type}/${service}`, data => {
        $('#shape-viewer').text(data.shape);
    });
}
