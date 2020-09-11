let services, hierarchy, tests;

let context, shexShapes, shexValidator;


$.get('/context', (ctxt) => {
    context = ctxt;
    $.get('/shex/shapes', (shps) => {
        shexShapes = JSON.parse(shps);
        shexValidator = new validation.shexValidator(context, shexShapes);
    });
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
    let dataset = await validation.inputToQuads(input, baseUrl, context);
    let dataItems = parseDataItems(dataset, baseUrl, 0);
    let report = await validate(input, $('#validation-lang-select').val());
    addReport('Recipe', report, dataItems);
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

async function clearTop(top, low) {
    top.forEach(topItem => {
        low = low.filter(lowItem => lowItem.property !== topItem.property && lowItem.message !== topItem.message);
    });
    return low;
}

async function validateService(data, service, options) {
    try {
        let res = await shexValidator.validate(data, service);
        res.forEach(x => x.service = (options && options.serviceName) || service);
        return res;
    } catch (e) {
        return [];
    }
}

async function recursiveValidate(data, hr) {
    if (hr.disabled) return [];
    if (!hr.nested) {
        let rep = await validateService(data, hr.service, {serviceName: hr.serviceName || hr.service});
        console.log(hr, rep)
        return rep;
    }
    let rootReport = await validateService(data, hr.service, {serviceName: hr.serviceName || hr.service});
    let nestedReport = (await (Promise.all(hr.nested.map(async service => await recursiveValidate(data, service))))).flat();
    nestedReport = await clearTop(rootReport, nestedReport);
    rootReport.push(...nestedReport);
    return rootReport;
}

async function validate(data) {
    let schemaReport = await recursiveValidate(data, hierarchy);
    return clearServicesDuplicates(schemaReport);
}