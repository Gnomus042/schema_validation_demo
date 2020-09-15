let services, hierarchy, tests;

let context;


$.get('/context', (ctxt) => {
    context = ctxt;
    initShex(context);
    initShacl(context);
});
$.get('/services', (res) => services = res.services);
$.get('/hierarchy', (res) => {
    hierarchy = JSON.parse(res.hierarchy);
    constructHierarchySelector(hierarchy, 0);
});
$.get('/tests', (res) => {
    tests = res.tests;
    $('#input-text').val(tests[1]);
    tests.forEach((test, idx) => {
        $('.tests').append(`<div class="test" id="test-${idx + 1}">Test ${idx + 1}</div>`);
        $(`#test-${idx + 1}`).click(() => $('#input-text').val(test));
    })
});



async function parse(input) {
    try {
        let data = JSON.parse(input);
        if (data['@graph']) data['@graph'].forEach(x => parseItem(JSON.stringify(x)));
        else parseItem(input);
    } catch (e) {
        parseItem(input);
    }
}

async function parseItem(input) {
    let baseUrl = validation.randomUrl();
    let report;
    if ($('#validation-lang-select').val() === 'shex') {
        report = await validateShex(input);
    } else {
        report = await shaclValidator.validate(input);
        report.failures.forEach(failure => {
           if (failure.service.includes('Google')) failure.service = 'Google';
           else if (failure.service.includes('Bing')) failure.service = 'Bing';
           else if (failure.service.includes('Pinterest')) failure.service = 'Pinterest';
           else if (failure.service.includes('Yandex')) failure.service = 'Yandex';
           else failure.service = 'Schema';
        });
    }
    let dataItems = parseDataItems(report.quads, report.baseUrl, 0);
    addReport('Recipe', clearServicesDuplicates(report.failures), dataItems);
}

function clearURL(val) {
    return val.replace('http://schema.org/', '')
        .replace('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', '@type');
}

function parseDataItems(dataset, shapeId, indent) {
    let dataItems = [];
    let shape = dataset.getQuads(shapeId, undefined, undefined);
    shape.forEach(quad => {
        dataItems.push(dataItemLayout(clearURL(quad.predicate.value), quad.object.value, indent));
        dataItems.push(...parseDataItems(dataset, quad.object, indent + 1));
    });
    return dataItems;
}

function clearServicesDuplicates(report) {
    let properties = {};
    report.forEach(item => {
        if (properties[item.property]) {
            properties[item.property].services.push({
                service: item.service,
                description: item.description,
                url: item.url
            });
        } else properties[item.property] = {
            property: item.property,
            severity: item.severity,
            message: item.message,
            services: [{
                service: item.service,
                description: item.description,
                url: item.url
            }]
        };
    });
    return Object.values(properties);
}
