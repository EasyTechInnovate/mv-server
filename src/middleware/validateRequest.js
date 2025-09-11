export const validateRequest = (schema, target = 'body') => {
    return async (req, res, next) => {
        let schemaData;

        // Check if schema expects multiple properties or specific single properties
        const schemaKeys = Object.keys(schema.shape || {});
        const hasMultipleTargets = schemaKeys.includes('params') && schemaKeys.includes('body');
        const hasOnlyParams = schemaKeys.includes('params') && !schemaKeys.includes('body');
        const hasOnlyQuery = schemaKeys.includes('query') && !schemaKeys.includes('body') && !schemaKeys.includes('params');

        if (hasMultipleTargets) {
            // For schemas that expect both params and body
            schemaData = {
                params: req.params || {},
                body: req.body || {},
                ...(schemaKeys.includes('query') && { query: req.query || {} })
            };
        } else if (hasOnlyParams) {
            // For schemas that expect only params
            schemaData = {
                params: req.params || {}
            };
        } else if (hasOnlyQuery) {
            // For schemas that expect only query
            schemaData = {
                query: req.query || {}
            };
        } else {
            // Original single-target validation logic
            let dataToValidate;
            switch (target) {
                case 'query':
                    dataToValidate = req.query || {};
                    break;
                case 'params':
                    dataToValidate = req.params || {};
                    break;
                case 'body':
                default:
                    dataToValidate = req.body || {};
                    break;
            }
            schemaData = target === 'body' ? { body: dataToValidate } : { [target]: dataToValidate };
        }

        const validationType = hasMultipleTargets ? 'params+body' : hasOnlyParams ? 'params' : hasOnlyQuery ? 'query' : target;
        console.log('Validating:', validationType, schemaData)

        const result = schema.safeParse(schemaData);

        if (!result.success) {
            console.log('Validation errors:', result.error.format())
            
            const formattedErrors = Object.entries(result.error.format())
                .filter(([key]) => key !== "_errors")
                .map(([field, error]) => ({
                    field,
                    message: Array.isArray(error) ? error.join(", ") : error._errors?.join(", ") || "Invalid input"
                }));

            return res.status(400).json({
                success: false,
                message: "Validation Failed.",
                errors: formattedErrors
            });
        }

        // Update req object with validated data
        if (hasMultipleTargets) {
            Object.assign(req.params, result.data.params || {});
            Object.assign(req.body, result.data.body || {});
            if (result.data.query) {
                Object.assign(req.query, result.data.query);
            }
        } else if (hasOnlyParams) {
            Object.assign(req.params, result.data.params || {});
        } else if (hasOnlyQuery) {
            Object.assign(req.query, result.data.query || {});
        } else {
            switch (target) {
                case 'query':
                    Object.assign(req.query, result.data.query || {});
                    break;
                case 'params':
                    Object.assign(req.params, result.data.params || {});
                    break;
                case 'body':
                default:
                    Object.assign(req.body, result.data.body || {});
                    break;
            }
        }

        next();
    };
};

export default validateRequest;