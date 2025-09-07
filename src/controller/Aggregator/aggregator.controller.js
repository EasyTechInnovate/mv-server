import AggregatorApplication from '../../model/aggregatorApplication.model.js'
import User from '../../model/user.model.js'
import responseMessage from '../../constant/responseMessage.js'
import httpResponse from '../../util/httpResponse.js'
import httpError from '../../util/httpError.js'

export default {
    async submitApplication(req, res, next) {
        try {
            const applicationData = req.body

            const existingApplication = await AggregatorApplication.findOne({ 
                emailAddress: applicationData.emailAddress 
            })

            if (existingApplication) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('An application with this email already exists')),
                    req,
                    409
                )
            }

            const existingUser = await User.findOne({ 
                emailAddress: applicationData.emailAddress 
            })

            if (existingUser) {
                return httpError(
                    next,
                    new Error(responseMessage.customMessage('A user with this email already exists')),
                    req,
                    409
                )
            }

            const application = new AggregatorApplication({
                ...applicationData,
                websiteLink: applicationData.websiteLink || null,
                instagramUrl: applicationData.instagramUrl || null,
                facebookUrl: applicationData.facebookUrl || null,
                linkedinUrl: applicationData.linkedinUrl || null,
                youtubeLink: applicationData.youtubeLink || null,
                popularReleaseLinks: applicationData.popularReleaseLinks || [],
                popularArtistLinks: applicationData.popularArtistLinks || [],
                associatedLabels: applicationData.associatedLabels || [],
                totalReleases: applicationData.totalReleases || 0,
                monthlyReleasePlans: applicationData.monthlyReleasePlans || 0,
                additionalServices: applicationData.additionalServices || [],
                applicationStatus: 'pending'
            })

            await application.save()

            const responseData = {
                application: {
                    _id: application._id,
                    companyName: application.companyName,
                    emailAddress: application.emailAddress,
                    applicationStatus: application.applicationStatus,
                    createdAt: application.createdAt
                }
            }

            return httpResponse(
                req,
                res,
                201,
                responseMessage.customMessage('Aggregator application submitted successfully. We will review your application and contact you soon.'),
                responseData
            )
        } catch (err) {
            return httpError(next, err, req, 500)
        }
    }
}