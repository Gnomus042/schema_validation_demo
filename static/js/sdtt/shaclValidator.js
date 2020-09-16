let shaclShapes, subclasses, shaclValidator;

async function initShacl(context) {
    await $.get('/shacl/shapes', async (shps) => {
        shaclShapes = shps;
        await $.get('/shacl/subclasses', (sbclasses) => {
            subclasses = sbclasses;
            shaclValidator = new validation.shaclValidator(shaclShapes, subclasses, context);
        });
    });
}

function flattenHierarchy(node) {
    let result = [node];
    if (node.nested) {
        node.nested.forEach(nstd => result.push(...flattenHierarchy(nstd)));
    }
    return result;
}

async function validateShacl(input) {
    let report = await shaclValidator.validate(input);
    let failures = [];
    report.failures.forEach(failure => {
        if (failure.service.includes('Google')) failure.service = 'Google';
        else if (failure.service.includes('Bing')) failure.service = 'Bing';
        else if (failure.service.includes('Pinterest')) failure.service = 'Pinterest';
        else if (failure.service.includes('Yandex')) failure.service = 'Yandex';
        else failure.service = 'Schema';
        flatHierarchy.forEach(fh => {
            if ((fh.service === failure.service || fh.serviceName === failure.service) && !fh.disabled) {
               failures.push(failure);
            }
        })
    });
    report.failures = failures;
    return report;
}
