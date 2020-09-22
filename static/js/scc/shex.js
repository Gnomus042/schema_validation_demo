async function validateShex(data, type, baseUrl) {
    return await recursiveValidate(hierarchy, type, data, baseUrl);
}

async function recursiveValidate(node, type, data, baseUrl) {
    if (node.disabled) return;
    let serviceName = node.service === 'Schema' ? '' : node.service;
    let startShape = `https://schema.org/shex#${serviceName}${type}`;
    let report;
    try {
        report = await shexValidator.validate(data, startShape, {baseUrl: baseUrl});
    } catch (e) {
        if (e.message.includes(`shape ${startShape} not found in:`)) {
            console.log(`Shape ${startShape} is not defined, validation skipped`);
            return;
        } else {
            throw e;
        }
    }
    report.failures.forEach(failure => failure.service = node.service);
    let nestedFailures = [];
    node.nested = node.nested || [];
    for (const nstd of node.nested) {
        let nstdReport = await recursiveValidate(nstd, type, data, baseUrl);
        if (nstdReport && nstdReport.failures.length > 0) {
            nestedFailures.push(...nstdReport.failures);
        }
    }
    report.failures = mergeFailures(report.failures, nestedFailures);
    return report;
}

function mergeFailures(a, b) {
    let existingProperties = new Set(a.map(item => item.property));
    b = b.filter(x => !existingProperties.has(x.property));
    if (b.length > 0) a.push(...b);
    return a;
}