import { decryptMessage } from "../crypto.js";
import db from "../db.js";

export const findUserRooms = async (req, res) => {
    // this timestamp is for groups with no messages yet, so they can have a date next to them
    const currentDate = new Date();
    const mysqlTimestamp = currentDate.toISOString().slice(0, 19).replace("T", " ");
    
    try {
        const { userId } = req.params;
        const [data] = await db.query(`
        SELECT
        rooms.roomId,
        rooms.type,
        rooms.name,
        rooms.profilePicture AS groupProfilePicture,
        GROUP_CONCAT(DISTINCT users.username) AS usernames,
        GROUP_CONCAT(DISTINCT users.profilePicture) AS userProfilePicture,
        MAX(COALESCE(lastMessage.text, '')) AS lastMessageText,
        MAX(COALESCE(lastMessage.messageId)) AS lastMessageId,
        MAX(COALESCE(lastMessage.senderId, 0)) AS lastMessageSenderId,
        MAX(COALESCE(lastMessage.isDeleted, 0)) AS lastMessageIsDeleted,
        MAX(COALESCE(lastMessage.image, '')) AS lastMessageImage,
        GROUP_CONCAT(seen_messages.seenBy) AS lastMessageSeenBy,
        MAX(COALESCE(lastMessage.date, ?)) AS lastMessageDate
        FROM rooms
        JOIN room_participants AS rp ON rooms.roomId = rp.roomId
        JOIN users ON users.userId = rp.userId
        LEFT JOIN (
            SELECT
                messages.messageId,
                messages.roomId,
                messages.text,
                messages.senderId,
                messages.isDeleted,
                messages.image,
                messages.date
            FROM messages
            WHERE (messages.roomId, messages.date) IN (
                SELECT roomId,
                    MAX(date) AS maxDate
                FROM messages
                GROUP BY roomId
            )
        ) AS lastMessage ON lastMessage.roomId = rp.roomId
        LEFT JOIN seen_messages ON seen_messages.messageId = lastMessage.messageId
        WHERE
            rooms.roomId IN (
                SELECT roomId
                FROM room_participants
                WHERE userId = ?
            ) AND (rooms.type = 'group' OR (rooms.type = 'private' AND users.userId != ?))
        GROUP BY
            rooms.roomId, rooms.type, rooms.name
        ORDER BY
            lastMessageDate DESC;    
    `, [mysqlTimestamp, userId, userId]);

        const newData = [...data].map(room => {
            return {
                ...room,
                lastMessageText: decryptMessage(room.lastMessageText),
                usernames: room.usernames?.split(',') ,
                profilePictures: room.profilePictures?.split(','),
                lastMessageSeenBy: room.lastMessageSeenBy?.split(',').map(message => Number(message)) || null
            }
        })

        res.status(200).json(newData);
    } catch (error) {
        res.status(500).json(error);
    }
}

export const createPrivateRoom = async (req, res) => {
    try {
        const { userOneId, userTwoId } = req.body;
        // if a room between these 2 already exists, return its id
        const userIds = `${userOneId},${userTwoId}`
        const reversedUserIds = `${userTwoId},${userOneId}`
        const [ doesRoomExist ] = await db.query(`
         SELECT
         rp.roomId,
         GROUP_CONCAT(rp.userId) as userIds,
         rooms.type
         FROM room_participants as rp
         JOIN rooms on rooms.roomId = rp.roomId
         WHERE rooms.type = 'private'
         GROUP BY roomId HAVING userIds = ? OR userIds = ?
        `, [userIds, reversedUserIds])
        if (doesRoomExist.length > 0) return res.status(200).json(doesRoomExist[0].roomId)
        // if not, create a new room and add them to it
        const [ room ] = await db.query(`INSERT INTO rooms (roomId, type) VALUES(DEFAULT, 'private')`)
        const roomId = room.insertId
        await db.query(`INSERT INTO room_participants (roomId, userId) VALUES (?, ?), (?, ?)`, [roomId, userOneId, roomId, userTwoId])
        res.status(200).json(roomId);
    } catch (error) {
        res.status(500).json(error);
    }
};

export const createGroup = async (req, res) => {
    try {
        const { groupName, groupMembers } = req.body
        const [ data ] = await db.query(`INSERT INTO rooms (type, name) VALUES ('group', ?)`, [groupName])
        const roomId = data.insertId

        const promises = groupMembers.map(async (user) => {
            await db.query(`INSERT INTO room_participants (roomId, userId) VALUES (?, ?)`, [roomId, user.userId])
        })
        await Promise.all(promises)

        res.status(200).json({ groupId: roomId })
    } catch (error) {
        res.status(500).json(error)
    }
}

export const updateGroupDescription = async (req, res) => {
    try {
        const { roomId } = req.params
        const { description } = req.body
        await db.query(`UPDATE rooms SET description = ? WHERE roomId = ? AND type = 'group'`, [description, roomId])
        res.status(200).json('Description updated.')
    } catch (error) {
        res.status(500).json(error)
    }
}

export const updateGroupProfilePicture = async (req, res) => {
    try {
        const { roomId } = req.params
        const { profilePicture } = req.body
        await db.query(`UPDATE rooms SET profilePicture = ? WHERE roomId = ?`, [profilePicture, roomId])
        res.status(200).json('Description updated.')
    } catch (error) {
        res.status(500).json(error)
    }
}

export const exitGroup = async (req, res) => {
    try {
        const { roomId, userId } = req.params
        await db.query(`DELETE FROM room_participants WHERE roomId = ? AND userId = ?`, [roomId, userId])
        res.status(200).json('Left group.')
    } catch (error) {
        res.status(500).json(error)
    }
}

export const addUsersToGroup = async (req, res) => {
    try {
        const { users, roomId } = req.body
        const allPromises = users.map(async (user) => {
            const [ isUserAlreadyInTheGroup ] = await db.query(`SELECT * FROM room_participants WHERE roomId = ? AND userId = ?`, [roomId, user.userId])
            if (isUserAlreadyInTheGroup.length === 0) await db.query(`INSERT INTO room_participants (roomId, userId) VALUES (?, ?)`, [roomId, user.userId])
        })
        await Promise.all(allPromises)
        res.status(200).json('Users have been added to group.')
    } catch (error) {
        res.status(500).json(error)
    }
}