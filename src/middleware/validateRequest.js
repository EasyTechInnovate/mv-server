export const validateRequest = (schema, target = 'body') => {
    return async (req, res, next) => {
        let schemaData;

        // Check if schema expects multiple properties or specific single properties
        const schemaKeys = Object.keys(schema.shape || {});
        const hasMultipleTargets = (schemaKeys.includes('params') && schemaKeys.includes('body')) ||
                                   (schemaKeys.includes('params') && schemaKeys.includes('query')) ||
                                   (schemaKeys.includes('body') && schemaKeys.includes('query')) ||
                                   (schemaKeys.includes('params') && schemaKeys.includes('body') && schemaKeys.includes('query'));
        const hasOnlyParams = schemaKeys.includes('params') && !schemaKeys.includes('body') && !schemaKeys.includes('query');
        const hasOnlyQuery = schemaKeys.includes('query') && !schemaKeys.includes('body') && !schemaKeys.includes('params');

        if (hasMultipleTargets) {
            // For schemas that expect multiple targets (params, body, query)
            schemaData = {};
            if (schemaKeys.includes('params')) schemaData.params = req.params || {};
            if (schemaKeys.includes('body')) schemaData.body = req.body || {};
            if (schemaKeys.includes('query')) schemaData.query = req.query || {};
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

        const validationType = hasMultipleTargets ? 'multiple_targets' : hasOnlyParams ? 'params' : hasOnlyQuery ? 'query' : target;
        console.log('Validating:', validationType, schemaData)

        const result = schema.safeParse(schemaData);

        if (!result.success) {
            console.log('Validation errors:', result.error.format())

            // Recursively flatten nested error objects to show exact field paths
            const flattenErrors = (obj, prefix = '') => {
                let errors = [];

                for (const [key, value] of Object.entries(obj)) {
                    if (key === '_errors' && Array.isArray(value) && value.length > 0) {
                        errors.push({
                            field: prefix || 'root',
                            message: value.join(', ')
                        });
                    } else if (typeof value === 'object' && value !== null) {
                        const nestedPath = prefix ? `${prefix}.${key}` : key;
                        errors = errors.concat(flattenErrors(value, nestedPath));
                    }
                }

                return errors;
            };

            const formattedErrors = flattenErrors(result.error.format());

            return res.status(400).json({
                success: false,
                message: "Validation Failed.",
                errors: formattedErrors.length > 0 ? formattedErrors : [{ field: 'unknown', message: 'Invalid input' }]
            });
        }

        // Update req object with validated data
        if (hasMultipleTargets) {
            if (result.data.params) Object.assign(req.params, result.data.params);
            if (result.data.body) Object.assign(req.body, result.data.body);
            if (result.data.query) Object.assign(req.query, result.data.query);
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
                    req.body = req.body || {};
                    Object.assign(req.body, result.data.body || {});
                    break;
            }
        }

        next();
    };
};

export default validateRequest;