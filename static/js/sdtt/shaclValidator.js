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
