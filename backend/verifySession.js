export const verifySession = async (req, res, next) => {
    if (!req.session || !req.session.userId) {
        res.status(401).json('unauthorized');
    } else {
        next();
    }
};
