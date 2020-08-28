let services;

$.get('/services', (res) => services = res.services);

async function parse(input) {
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
       dataItems.push(...parseDataItems(dataset, quad.object, indent+1));
    });
    return dataItems;
}

function clearServicesDuplictes(report) {
    let seen = {};
    report.forEach(item => {
        if (seen[item.property]) seen[item.property].services.push(...item.services);
        else seen[item.property] = item;
    });
    return Object.values(seen);
}

async function validate(data, lang) {
    let report = (await (Promise.all(services.map(async service => {
        let res = (await validation.validate(data, service))[lang];
        res.forEach(x => x.services = [service]);
        return res;
    })))).flat();
    return clearServicesDuplictes(report);
}