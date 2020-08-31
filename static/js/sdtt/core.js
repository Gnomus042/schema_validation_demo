let services;

$.get('/services', (res) => services = res.services);

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
    let seen = {};
    report.forEach(item => {
        if (seen[item.property]) {
            item.services.forEach(service => {
                if (!seen[item.property].services.includes(service)) {
                    seen[item.property].services.push(service);
                }
            });
        } else seen[item.property] = item;
    });
    return Object.values(seen);
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
        res.forEach(x => x.services = [ (options && options.serviceName) || service]);
        return res;
    } catch (e) {
        return [];
    }
}

async function validate(data, lang) {
    let schemaReport = await validateService(data, lang, '', {serviceName: 'Schema'});
    let report = (await (Promise.all(services.map(async service => await validateService(data, lang, service))))).flat();
    report = await clearTop(schemaReport, report);
    schemaReport.push(...report);
    return clearServicesDuplicates(schemaReport);
}