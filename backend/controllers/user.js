import db from '../db.js'

export const checkUsername = async (req, res) => {
    try {
        const { username } = req.params
        const [ isUsernameAvailable ] = await db.query('SELECT username FROM users WHERE username = ?', [username])
        if (isUsernameAvailable.length > 0) res.status(200).json({
            status: 'unavailable',
            message: 'An account with this username already exists.'
        })
        else res.status(200).json({
            status: 'available',
            message: 'Username available.'
        })
    } catch (error) {
        res.status(500).json(error)
    }
}

export const findUser = async (req, res) => {
    try {
        const { userId } = req.params
        const [ user ] = await db.query('SELECT * FROM users WHERE userId = ?', [userId])
        res.status(200).json(user[0])
    } catch (error) {
        res.status(500).json(error)
    }
}

export const findUsersFromRoom = async (req, res) => {
    try {
        const { roomId, currentUserId } = req.params

        const [ doesUserBelong ] = await db.query(`SELECT * FROM room_participants as rp WHERE rp.roomId = ? AND rp.userId = ?`, [roomId, currentUserId])

        if (doesUserBelong.length === 0) return res.status(400).json('You dont have access to this private room.')

        const [data] = await db.query(`
        SELECT 
            rp.userId,
            rp.roomId,
            GROUP_CONCAT(users.username) AS username,
            MAX(users.profilePicture) AS userProfilePicture,
            MAX(users.status) AS userStatus,
            MAX(rooms.name) AS groupName,
            MAX(rooms.type) AS roomType,
            MAX(rooms.profilePicture) AS groupProfilePicture,
            MAX(rooms.description) AS groupDescription
        FROM 
            room_participants AS rp
        JOIN 
            users ON users.userId = rp.userId
        JOIN 
            rooms ON rooms.roomId = rp.roomId
        WHERE 
            rp.roomId = ?
        GROUP BY 
            rp.userId, rp.roomId;
    `, [roomId]);

        res.status(200).json(data)
    } catch (error) {
        res.status(500).json(error)
    }
}

export const updateProfilePicture = async (req, res) => {
    try {
        const { userId } = req.params
        const { profilePicture } = req.body
        await db.query('UPDATE users SET profilePicture = ? WHERE userId = ?', [profilePicture, userId])
        res.status(200).json('Changes saved successfully!')
    } catch (error) {
        res.status(500).json(error)
    }
}

export const updateUsername = async (req, res) => {
    try {
        const { userId } = req.params
        const { username } = req.body
        const [ isUsernameTaken ] = await db.query('SELECT * FROM users WHERE username = ?', [username])
        if (isUsernameTaken.length > 0) return res.status(400).json('An account with this username already exists.')
        await db.query('UPDATE users SET username = ? WHERE userId = ?', [username, userId])
        res.status(200).json('Changes saved successfully!')
    } catch (error) {
        res.status(500).json(error)
    }
}

export const updateDescription = async (req, res) => {
    try {
        const { userId } = req.params
        const { description } = req.body
        await db.query('UPDATE users SET description = ? WHERE userId = ?', [description, userId])
        res.status(200).json('Changes saved successfully!')
    } catch (error) {
        res.status(500).json(error)
    }
}

export const searchUsers = async (req, res) => {
    try {
        const { input, userId } = req.params
        const searchString = `%${input}%`
        const [ data ] = await db.query(`SELECT username, profilePicture, userId FROM users WHERE username LIKE ? AND NOT userId = ?`, [searchString, userId])
        res.status(200).json(data)
    } catch (error) {
        res.status(500).json(error)
    }
}

export const updateOnlineStatus = async (req, res) => {
    try {
        const { userId } = req.params
        const { status } = req.body
        await db.query('UPDATE users SET status = ? WHERE userId = ?', [status, userId])
        res.status(200).end()
    } catch (error) {
        res.status(500).json(error)
    }
}

export const banUser = async (req, res) => {
    try {
        const { userId } = req.params
        await Promise.all([
            await db.query(`DELETE FROM seen_messages WHERE messageId IN (SELECT messageId FROM messages WHERE senderId = ?) OR seenBy = ?`, [userId, userId]),
            await db.query(`DELETE FROM messages WHERE senderId = ?`, [userId]),
            await db.query(`DELETE FROM room_participants WHERE userId = ?`, [userId]),
            await db.query(`DELETE FROM users WHERE userId = ?`, [userId])
        ])

        res.status(200).json('Banned')
    } catch (error) {
        res.status(500).json(error)
    }
}

export const addUserStrikes = async (req, res) => {
    try {
        const { userId } = req.params
        const [ data ] = await db.query('UPDATE users SET strikes = strikes + 1 WHERE userId = ?', [userId])
        res.status(200).json(data)
    } catch (error) {
        console.error(error)
    }
}