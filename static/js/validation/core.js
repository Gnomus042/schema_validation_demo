const shexURL = window.location + 'shex/shapes';
let context, supportedServices, tests;
let shaclShapes = new Map();

let allowedServices;


// loading context and SHACL shapes
$.get('/context', data => context = data);
$.get('/services', data => {
    supportedServices = data.services;
    prepareValidationTable();
    initServiceSelect();
    supportedServices.forEach(service => {
        $.get(`/shacl/shapes/${service}`, shapes => {
            shaclShapes.set(service, shapes);
        });
    })
});
$.get('/services/allowed', data => {
    allowedServices = data;
})
$.get('tests', data => {
    initTests(data.tests);
});

// SHACL helpers
function stringToUrl(str) {
    var blob = new Blob([str], {type: 'text/plain'});
    return window.URL.createObjectURL(blob);
}

function getShexReport(data, dataId, service) {
    let resolver;
    let promise = new Promise((res, rej) => resolver = res);

    let type = validation.clearURL(JSON.parse(data)['@type']);
    if (allowedServices.shex[type].indexOf(service) === -1) {
        resolver(undefined);
        return promise;
    }

    let shexErrors = validation.validateShEx(stringToUrl(data), shexURL, dataId, `http://schema.org/shex#${service}${type}`, true);
    let shexWarnings = validation.validateShEx(stringToUrl(data), shexURL, dataId, `http://schema.org/shex#${service}${type}Strict`, true);
    Promise.all([shexErrors, shexWarnings])
        .then(res => {
            // TODO improve ugly duplicates removal
            let errorProps = [...new Set(res[0].map(x => x.property))];
            res[1] = res[1].filter(x => errorProps.indexOf(x.property) === -1)

            let errors = [...new Set(res[0].map(JSON.stringify))];
            let warnings = [...new Set(res[1].map(JSON.stringify))];

            let prepareItems = items => {
                items = items.map(JSON.parse);
                items.forEach(x => {
                    if (x.property) {
                        x.property = validation.clearURL(x.property)
                    }
                    if (x.target) {
                        x.target = x.target.join(", ");
                    }
                    if (x.possibleValues) {
                        x.possibleValues = x.possibleValues.join(", ");
                    }
                });
                return items;
            }

            resolver({errors: prepareItems(errors), warnings: prepareItems(warnings)});
        });
    return promise;
}

// SHACL helpers
function getShaclReport(data, service) {
    let resolver;
    let promise = new Promise((res, rej) => resolver = res);

    let type = validation.clearURL(JSON.parse(data)['@type']);
    if (allowedServices.shacl[type].indexOf(service) === -1) {
        resolver(undefined);
        return promise
    }

    let errors = [];
    let warnings = [];
    validation.validateShacl(data, shaclShapes.get(service))
        .then(report => {
            report.results.forEach(res => {
                console.log(res.path);
                if (res.path) {
                    let simplified = {
                        property: validation.clearURL(res.path.value),
                        description: res.message.map(x => x.value).join('/n')
                    }
                    validation.clearURL(res.severity.value) === "Violation" ? errors.push(simplified) : warnings.push(simplified);
                }
            });
            resolver({errors: errors, warnings: warnings});
        });
    return promise;
}

// core
function validate(data) {
    data = prepareDataToValidation(data);
    let dataId = data['@id'];
    data = JSON.stringify(data);
    let report = new Map();

    new Promise((resolve, reject) => {
        let readyCount = 0;
        supportedServices.forEach((service, idx) => {
            let shex = getShexReport(data, dataId, service);
            let shacl = getShaclReport(data, service);
            Promise.all([shex, shacl]).then(res => {
                report.set(service, {shex: res[0], shacl: res[1]});
                readyCount++;
                if (readyCount === supportedServices.length) {
                    resolve();
                }
            });
        });
    }).then(() => fillValidationTable(report));
}

function prepareDataToValidation(data) {
    if (data["@id"] === undefined) {
        alert("Please add the @id field");
        throw "@id field not found in data";
    } else if (data["@type"] !== "Recipe" && data["@type"] !== "Dataset") { // TODO maybe a better check here
        alert("@type should be Recipe or Dataset");
        throw "@type in not http://schema.org/Recipe";
    }
    data['@context'] = context;
    return data;
}
