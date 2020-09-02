let services, hierarchy, tests;

$.get('/services', (res) => services = res.services);
$.get('/hierarchy', (res) => {
    hierarchy = JSON.parse(res.hierarchy);
    constructHierarchySelector(hierarchy, 0);
});
$.get('/tests', (res) => {
    tests = res.tests;
    $('#input-text').val(tests[1]);
    tests.forEach((test, idx) => {
        $('.tests').append(`<div class="test" id="test-${idx+1}">Test ${idx+1}</div>`);
        $(`#test-${idx+1}`).click(() => $('#input-text').val(test));
    })
});

async function parse(input) {
    let data = JSON.parse(input);
    if (data['@graph']) data['@graph'].forEach(x => parseItem(JSON.stringify(x)));
    else parseItem(input);
}

async function parseItem(input) {
    input = await validation.prepareData(input);
    let dataset = await validation.loadDataset(input, 'json-ld');
    let startId = JSON.parse(input)['@id'];
    let dataItems = parseDataItems(dataset, startId, 0);
    let report = await validate(input, $('#validation-lang-select').val());
    addReport(clearURL(JSON.parse(input)['@type']), report, dataItems);
}

function clearURL(val) {
    return val.replace('http://schema.org/', '')
        .replace('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', '@type');
}

function parseDataItems(dataset, shapeId, indent) {
    let dataItems = [];
    let shape = dataset.match(shapeId, undefined, undefined);
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

async function validateService(data, lang, service, options) {
    try {
        let res = (await validation.validate(data, service, {
            shex: lang === 'shex', shacl: lang === 'shacl'
        }))[lang];
        res.forEach(x => x.service = (options && options.serviceName) || service);
        return res;
    } catch (e) {
        return [];
    }
}

async function recursiveValidate(data, lang, hr) {
    if (hr.disabled) return [];
    if (!hr.nested) {
        let rep = await validateService(data, lang, hr.service, {serviceName: hr.serviceName || hr.service});
        console.log(hr, rep)
        return rep;
    }
    let rootReport = await validateService(data, lang, hr.service, {serviceName: hr.serviceName || hr.service});
    let nestedReport = (await (Promise.all(hr.nested.map(async service => await recursiveValidate(data, lang, service))))).flat();
    nestedReport = await clearTop(rootReport, nestedReport);
    rootReport.push(...nestedReport);
    return rootReport;
}

async function validate(data, lang) {
    let schemaReport = await recursiveValidate(data, lang, hierarchy);
    return clearServicesDuplicates(schemaReport);
}