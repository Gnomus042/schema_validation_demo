async function validateShacl(data, baseUrl) {
    let report = await shaclValidator.validate(data, {baseUrl: baseUrl});
    report.failures.forEach(failure => {
        failure.service = shapeToService[removeUrls(failure.shape)];
    });
    removeDisabled(hierarchy, report);
    return report;
}

function removeDisabled(node, report) {
    if (node.disabled) {
        report.failures = report.failures.filter(failure => failure.service !== node.service);
    }
    if (node.nested) {
        node.nested.forEach(nstd => removeDisabled(nstd, report));
    }
}