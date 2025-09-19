import { EUserRole, EModuleAccess } from "../constant/application.js";
import responseMessage from "../constant/responseMessage.js";
import httpError from "../util/httpError.js";

export default (requiredModule) => {
    return (req, _res, next) => {
        try {
            const user = req.authenticatedUser;

            if (!user) {
                return httpError(next, new Error(responseMessage.customMessage('You are not authenticated')), req, 401);
            }

            if (user.role === EUserRole.ADMIN) {
                return next();
            }

            if (user.role === EUserRole.TEAM_MEMBER) {
                if (user.moduleAccess && user.moduleAccess.includes(requiredModule)) {
                    return next();
                }
            }

            return httpError(next, new Error(responseMessage.customMessage('Access denied to this module')), req, 403);
        } catch (error) {
            httpError(next, error, req, 500);
        }
    };
};