export const validateRequest = (schema, target = 'body') => {
    return async (req, res, next) => {
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

        console.log('Validating:', target, dataToValidate)

        // For body validation, wrap the data in body property to match schema structure
        const schemaData = target === 'body' ? { body: dataToValidate } : { [target]: dataToValidate };
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

        next();
    };
};

export default validateRequest;