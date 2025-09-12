import Sublabel from '../model/sublabel.model.js'
import User from '../model/user.model.js'
import { EUserType, ESublabelMembershipStatus } from '../constant/application.js'

export const initializeDefaultSublabels = async () => {
    try {
        const existingMaheshwariVisual = await Sublabel.findOne({ name: 'Maheshwari Visual' })
        
        if (!existingMaheshwariVisual) {
            const defaultSublabel = new Sublabel({
                name: 'Maheshwari Visual',
                membershipStatus: ESublabelMembershipStatus.ACTIVE,
                contractStartDate: new Date(),
                contractEndDate: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), // 10 years from now
                description: 'Default sublabel for Maheshwari Visual platform',
                contactInfo: {
                    email: 'support@maheshwarivisual.com'
                }
            })
            
            await defaultSublabel.save()
            console.log('Default Maheshwari Visual sublabel created')
        }
    } catch (error) {
        console.error('Error initializing default sublabels:', error)
    }
}

export const assignDefaultSublabelToUser = async (userId, userType) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw new Error('User not found')
        }

        if (userType === EUserType.ARTIST) {
            const maheshwariVisualSublabel = await Sublabel.findOne({ name: 'Maheshwari Visual' })
            if (maheshwariVisualSublabel) {
                const existingAssignment = user.sublabels.find(
                    sub => sub.sublabel.toString() === maheshwariVisualSublabel._id.toString()
                )

                if (!existingAssignment) {
                    user.sublabels.push({
                        sublabel: maheshwariVisualSublabel._id,
                        isDefault: true,
                        isActive: true
                    })
                    await user.save()
                    console.log(`Default sublabel assigned to artist: ${user.firstName} ${user.lastName}`)
                }
            }
        }
    } catch (error) {
        console.error('Error assigning default sublabel:', error)
        throw error
    }
}

export const createLabelSublabel = async (userId, contractStartDate = new Date(), contractEndDate = null) => {
    try {
        const user = await User.findById(userId)
        if (!user || user.userType !== EUserType.LABELS) {
            throw new Error('User not found or not a label')
        }

        const sublabelName = `${user.firstName} ${user.lastName}`.trim()
        
        const existingSublabel = await Sublabel.findOne({ name: sublabelName })
        if (existingSublabel) {
            const existingAssignment = user.sublabels.find(
                sub => sub.sublabel.toString() === existingSublabel._id.toString()
            )

            if (!existingAssignment) {
                user.sublabels.push({
                    sublabel: existingSublabel._id,
                    isDefault: true,
                    isActive: true
                })
                await user.save()
            }
            
            return existingSublabel
        }

        // Use subscription end date or fallback to 10 years
        const endDate = contractEndDate || user.subscription?.validUntil || new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000)

        const labelSublabel = new Sublabel({
            name: sublabelName,
            membershipStatus: ESublabelMembershipStatus.ACTIVE,
            contractStartDate: contractStartDate,
            contractEndDate: endDate,
            description: `Sublabel for ${sublabelName}`,
            contactInfo: {
                email: user.emailAddress
            }
        })

        await labelSublabel.save()

        user.sublabels.push({
            sublabel: labelSublabel._id,
            isDefault: true,
            isActive: true
        })
        await user.save()

        console.log(`Label sublabel created for: ${sublabelName}`)
        return labelSublabel
    } catch (error) {
        console.error('Error creating label sublabel:', error)
        throw error
    }
}

export const getUserActiveSublabels = async (userId) => {
    try {
        const user = await User.findById(userId)
            .populate('sublabels.sublabel', 'name membershipStatus contractStartDate contractEndDate')

        if (!user) {
            return []
        }

        return user.sublabels
            .filter(sub => sub.isActive)
            .map(sub => ({
                id: sub.sublabel._id,
                name: sub.sublabel.name,
                membershipStatus: sub.sublabel.membershipStatus,
                contractStartDate: sub.sublabel.contractStartDate,
                contractEndDate: sub.sublabel.contractEndDate,
                isDefault: sub.isDefault,
                assignedAt: sub.assignedAt
            }))
    } catch (error) {
        console.error('Error getting user sublabels:', error)
        return []
    }
}

export const getUserDefaultSublabel = async (userId) => {
    try {
        const user = await User.findById(userId)
            .populate('sublabels.sublabel', 'name')

        if (!user) {
            return null
        }

        const defaultSublabel = user.sublabels.find(sub => sub.isDefault && sub.isActive)
        return defaultSublabel ? {
            id: defaultSublabel.sublabel._id,
            name: defaultSublabel.sublabel.name
        } : null
    } catch (error) {
        console.error('Error getting default sublabel:', error)
        return null
    }
}