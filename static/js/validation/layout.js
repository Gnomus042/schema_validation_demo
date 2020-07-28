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
        $('.tests>div').eq(idx).on('click', () => $("#text-data-input").val(test));
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

        fillSpecReport(specReport.shex, reportCells.eq(idx * 2));
        if (specReport.shacl.errors) {
            fillSpecReport(specReport.shacl, reportCells.eq(idx * 2 + 1));
        }
    })
}

function fillSpecReport(specReport, reportCell) {
    reportCell.removeClass('d-none');
    reportCell.find('.errors>span').text(specReport.errors.length);
    reportCell.find('.warnings>span').text(specReport.warnings.length);
    fillDetails(specReport, reportCell.find('.details'));
}

function fillDetails(specReport, detailsField) {
    detailsField.empty();
    fillDetailsItems(specReport.errors, detailsField, 'error');
    fillDetailsItems(specReport.warnings, detailsField, 'warning');
}

function fillDetailsItems(items, detailsField, type) {
    items.forEach(item => {
            let additionalInfo = "";
            for (const [key, val] of Object.entries(item)) {
                if (key !== 'property') {
                    additionalInfo += `<div><span class="font-weight-bold">${key}:</span> ${val}</div>`
                }
            }
            detailsField.append(`
                <div class="details-item ${type}-item">
                    <div class="head">${item.property}</div>
                    <div class="info">${additionalInfo}</div>
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

function changeDisplayedShape() {
    let lang = $("#language-select").val();
    let service = $("#service-select").val();
    $.get(`shape/${lang}/${service}`, data => {
       $('#shape-viewer').text(data.shape);
    });
}
