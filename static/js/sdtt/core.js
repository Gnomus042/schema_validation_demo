let services;

$.get('/services', (res) => services = res.services);

async function parse(input) {
    input = await validation.prepareData(input);
    let dataset = await validation.loadDataset(input, 'json-ld');
    let startId = JSON.parse(input)['@id'];
    addLayoutBlocks(dataset, startId, 0);
}

function clearURL(val) {
    return val.replace('http://schema.org/', '')
        .replace('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', '@type');
}

function addLayoutBlocks(dataset, shapeId, indent) {
    let shape = dataset.match(shapeId, undefined, undefined);
    shape.forEach(quad => {
       addDataItem(clearURL(quad.predicate.value), quad.object.value, indent);
       addLayoutBlocks(dataset, quad.object, indent+1);
    });
    return shape.length > 0;
}

function validate(data) {

}