let supportedServices, tests;
let RdfTerm = ShExWebApp.RdfTerm;

// loading context and SHACL shapes
$.get('/services', data => {
    supportedServices = data.services;
    prepareValidationTable();
    initServiceSelect();
});
$.get('tests', data => {
    initTests(data.tests);
});

function validate(data) {
    checkData(data);
    let report = new Map();

    new Promise((resolve, reject) => {
        let readyCount = 0;
        supportedServices.forEach((service, idx) => {
            validation.validate(JSON.stringify(data), service, {shex: true, shacl: true}).then(res => {
                report.set(service, res);
                readyCount++;
                if (readyCount === supportedServices.length) {
                    resolve();
                }
            });
        });
    }).then(() => fillValidationTable(report));
}

function checkData(data) {
    if (data["@id"] === undefined) {
        alert("Please add the @id field");
        throw "@id field not found in data";
    } else if (data["@type"] !== "Recipe" && data["@type"] !== "Dataset") { // TODO maybe a better check here
        alert("@type should be Recipe or Dataset");
        throw "@type in not http://schema.org/Recipe";
    }
}
