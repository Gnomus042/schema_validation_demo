let currText = "";

$("#validate-btn").on('click', async () => {
    $('.reports').empty();
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
    let services = failure.services.map(x => {
        return `<a href="${x.url || ''}" title="${x.description||""}">
            <img class="service-icon" src="static/images/services/${x.service}.png" alt="${x.service}"/>
        </a>`
    }).join('');
    return `<div class="failure ${type}">
        <div class="property">
            <img src="static/images/icons/${type}.svg" alt="${type}">
            <div>${clearURL(failure.property)}</div>
        </div>
        <div class="message">
            <div class="text-justify">${clearURL(failure.message) || ""}.</div> 
        </div>
        <div class="services"><div>${services}</div></div>
    </div>`
}

function addReport(type, report, dataItems) {
    let errors = report.filter(x => x.severity === 'error').map(x => failureLayout(x, x.severity));
    let warnings = report.filter(x => x.severity === 'warning').map(x => failureLayout(x, x.severity));
    let infos = report.filter(x => x.severity === 'info').map(x => failureLayout(x, 'recommendation'));
    let id = $('.report').length;
    let reportLayout = `
        <div class="report" id="report-${id}">
            <div class="title">
                <div><b>${type}</b></div>
                <div class="error"><span id="errors-count">${errors.length}</span> errors</div>
                <div class="warning"><span id="warnings-count">${warnings.length}</span> warnings</div>
            </div>
            <div class="data-items">${dataItems.join('')}</div>
            <div class="errors">${errors.join('') + warnings.join('') + infos.join('')}</div>
        </div>
    `;
    $('.reports').append(reportLayout);
    $(`#report-${id}>.title`).on("click", function () {
        $(this).parent().find('.errors').toggle();
        $(this).parent().find('.data-items').toggle();
    });
}

function constructHierarchySelector(data, indent) {
    let name = data.serviceName || data.service;
    $('.h-items').append(`<div class="h-item">
          <div style="width: ${indent * 30}px"></div>
          <input type="checkbox" checked id="${name}" class="form-control">
          <div> <img src="static/images/services/${name}.png" class="service-icon" alt="${name}"> ${name}</div>
     </div>`);
    $(`#${name}`).change(function () {
        data.disabled = !this.checked;
        if (data.disabled) {
            disableBranch(data);
        } else {
            enableBranch(hierarchy, data);
        }
    })
    if (data.nested)
        data.nested.forEach(x => constructHierarchySelector(x, indent + 1));
}

function disableBranch(node) {
    let name = node.serviceName || node.service;
    $(`#${name}`).prop('checked', false);
    node.disabled = true;
    if (node.nested)
        node.nested.forEach(nest => disableBranch(nest));
}

function enableBranch(node, tnode) {
    let name = node.serviceName || node.service;
    if (node.service === tnode.service) {
        node.disabled = false;
        $(`#${name}`).prop('checked', true);
        return true;
    }
    if (!node.nested) return false;
    let toCheck = false;
    node.nested.forEach(nest => toCheck = toCheck || enableBranch(nest, tnode));
    if (toCheck) {
        node.disabled = false;
        $(`#${name}`).prop('checked', true);
    }
    return toCheck;
}