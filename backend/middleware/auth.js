const prisma = require('../prismaClient');
const { getDefaultProjectsData } = require('../utils/defaultData');

const authenticateUser = async (req, res, next) => {
    const userId = req.headers['x-user-id'];

    if (!userId) {
        return res.status(401).json({ error: 'Missing X-User-ID header' });
    }

    try {
        let user = await prisma.user.findUnique({
            where: { id: userId }
        });

        // If user doesn't exist, create it and seed basic data
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: userId,
                    projects: getDefaultProjectsData()
                }
            });
            console.log(`[AUTH] Created new anonymous user: ${userId} with default data.`);
        }

        req.userId = userId;
        next();
    } catch (error) {
        console.error('[AUTH ERROR]', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

module.exports = authenticateUser;
