let shexShapes, shexValidator;

function initShex(context) {
    $.get('/shex/shapes', (shps) => {
        shexShapes = JSON.parse(shps);
        shexValidator = new validation.shexValidator(context, shexShapes);
    });
}


async function clearTop(top, low) {
    top.forEach(topItem => {
        low = low.filter(lowItem => lowItem.property !== topItem.property && lowItem.message !== topItem.message);
    });
    return low;
}

async function validateService(data, service, options) {
    try {
        let res = await shexValidator.validate(data, service);
        res.failures.forEach(x => x.service = (options && options.serviceName) || service);
        return res;
    } catch (e) {
        return [];
    }
}

async function recursiveValidate(data, hr) {
    if (hr.disabled) return [];
    if (!hr.nested) {
        return await validateService(data, hr.service, {serviceName: hr.serviceName || hr.service});
    }
    let rootReport = await validateService(data, hr.service, {serviceName: hr.serviceName || hr.service});
    let nestedReport = (await (Promise.all(hr.nested.map(async service => (await recursiveValidate(data, service)).failures)))).flat();
    nestedReport = nestedReport.filter(nrprt => nrprt !== undefined);
    nestedReport = await clearTop(rootReport.failures, nestedReport);
    rootReport.failures.push(...nestedReport);
    return rootReport;
}

async function validateShex(data) {
    return await recursiveValidate(data, hierarchy);
}