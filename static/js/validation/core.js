const shexURL = window.location + 'static/validation/shex/full.shex';
let context, supportedServices, tests;
let shaclShapes = new Map();

// loading context and SHACL shapes
$.get('static/validation/context.json', data => context = data);
$.get('services', data => {
    supportedServices = data.services;
    prepareValidationTable();
    initServiceSelect();
    supportedServices.forEach(service => {
        $.get(`shacl/shapes/${service}`, shapes => {
            shaclShapes.set(service, shapes);
        });
    })
});
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
    let shexErrors = validation.validateShEx(stringToUrl(data), shexURL, dataId, `http://schema.org/shex#${service}Recipe`, true);
    let shexWarnings = validation.validateShEx(stringToUrl(data), shexURL, dataId, `http://schema.org/shex#${service}RecipeStrict`, true);
    Promise.all([shexErrors, shexWarnings])
        .then(res => {
            // TODO improve ugly duplicates removal
            let errors = [...new Set(res[0].map(JSON.stringify))];
            let warnings = [...new Set(res[1].map(JSON.stringify))];
            errors.forEach(err => {
                if (warnings.indexOf(err) > -1) {
                    warnings.splice(warnings.indexOf(err), 1);
                }
            });
            errors = errors.map(JSON.parse);
            errors.forEach(x => x.property = validation.clearURL(x.property));
            warnings = warnings.map(JSON.parse);
            warnings.forEach(x => x.property = validation.clearURL(x.property));
            resolver({errors: errors, warnings: warnings});
        });
    return promise;
}

// SHACL helpers
function getShaclReport(data, service) {
    let resolver;
    let promise = new Promise((res, rej) => resolver = res);
    let errors = [];
    let warnings = [];
    validation.validateShacl(data, shaclShapes.get(service))
        .then(report => {
            report.results.forEach(res => {
                let simplified = {
                    property: res.path ? validation.clearURL(res.path.value):"General violation",
                    description: res.message.map(x => x.value).join('/n')
                }
                validation.clearURL(res.severity.value) === "Violation" ? errors.push(simplified) : warnings.push(simplified);
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
    } else if (data["@type"] !== "Recipe") { // TODO maybe a better check here
        alert("@type is not Recipe");
        throw "@type in not http://schema.org/Recipe";
    }
    data['@context'] = context;
    return data;
}
