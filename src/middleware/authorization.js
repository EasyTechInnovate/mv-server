import responseMessage from "../constant/responseMessage.js"
import httpError from "../util/httpError.js"

export default (roles) => {
    return (req, _res, next) => {
        try {
            const user = req.authenticatedUser

            console.log('User role:', user.role);
            

            if (!user) {
                return httpError(next, new Error(responseMessage.customMessage('You are not authenticated')), req, 401)
            }

            if (!roles.includes(user.role)) {
                return httpError(next, new Error(responseMessage.customMessage('You are not authorized to perform this action.')), req, 403)
            }

            next()
        } catch (error) {
            httpError(next, error, req, 500)
        }
    }
}