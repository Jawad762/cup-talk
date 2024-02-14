import { decryptMessage, encryptMessage } from '../crypto.js'
import db from '../db.js'

export const getConversationMessages = async (req, res) => {
    try {
        const { roomId } = req.params
        const [ data ] = await db.query(`
        SELECT
        messages.messageId,
        messages.senderId,
        messages.text,
        messages.image,
        messages.roomId,
        messages.isDeleted,
        messages.date,
        users.username,
        users.profilePicture AS userProfilePicture,
        GROUP_CONCAT(seen_messages.seenBy) AS seenBy
        FROM messages
        JOIN users on users.userId = messages.senderId
        LEFT JOIN seen_messages on seen_messages.messageId = messages.messageId
        WHERE roomId = ?
        GROUP BY messages.messageId
        ORDER BY messages.date ASC
        `, [ roomId ])

        const decryptedData = data.map(message => {
            return {
                ...message,
                text: decryptMessage(message.text),
                seenBy: message.seenBy?.split(',').map(userId => Number(userId))
            }
        })

        res.status(200).json(decryptedData)
    } catch (error) {
        res.status(500).json(error)
    }
}

export const createMessage = async (req, res) => {
    try {
        const { senderId, roomId, text, image } = req.body
        const encryptedMessage = encryptMessage(text)
        await db.query('INSERT INTO messages (senderId, roomId, text, image) VALUES (?, ?, ?, ?)' , [senderId, roomId, encryptedMessage, image])
        res.status(200).json('Message sent successfully')
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params
        await db.query(`UPDATE messages SET isDeleted = true WHERE messageId = ?`, [messageId])
        res.status(200).json('Message deleted successfully')
    } catch (error) {
        res.status(500).json(error)
    }
}

export const updateSeenStatus = async (req, res) => {
    try {
        const { roomId, seenByUser } = req.params
        const [ seenMessages ] = await db.query(`
        SELECT 
        messageId 
        FROM messages 
        WHERE senderId != ? AND roomId = ? AND messageId NOT IN (
            SELECT messageId FROM seen_messages WHERE seenBy = ?
        )
        `, [seenByUser, roomId, seenByUser])
        const allPromises = seenMessages.map(async (message) => {
            await db.query(`INSERT INTO seen_messages (messageId, seenBy) VALUES (?, ?)`, [message.messageId, seenByUser])
        })
        await Promise.all(allPromises)
        res.status(200).end()
    } catch (error) {
        res.status(500).json(error)
    }
}

export const composeMessage = async (req, res) => {
    try {
        const { messageText, senderId, receiverId } = req.body
        const encryptedMessage = encryptMessage(messageText)
        const user_ids = `${senderId},${receiverId}`
        const reversed_user_ids = `${receiverId},${senderId}`

        const [ doesRoomExist ] = await db.query(`
            SELECT 
            rp.roomId,
            GROUP_CONCAT(rp.userId) as user_ids,
            rooms.type
            FROM room_participants as rp
            JOIN rooms ON rooms.roomId = rp.roomId
            WHERE rooms.type = 'private'
            GROUP BY roomId HAVING user_ids = ? OR user_ids = ?
        `, [user_ids, reversed_user_ids])

        if (doesRoomExist.length > 0) {
            await db.query(`INSERT INTO messages (senderId, roomId, text) VALUES (?, ?, ?)`, [senderId, doesRoomExist[0].roomId, encryptedMessage])
            return res.status(200).json({ roomId: doesRoomExist[0].roomId })
        }

        else {
            const [ newRoom ] = await db.query(`INSERT INTO rooms (roomId, type) VALUES (DEFAULT, 'private')`)
            await db.query(`
             INSERT INTO room_participants (roomId, userId) VALUES
             (?, ?),
             (?, ?)
             `, [newRoom.insertId, senderId, newRoom.insertId, receiverId])
            await db.query(`INSERT INTO messages (senderId, roomId, text) VALUES (?, ?, ?)`, [senderId, newRoom.insertId, encryptedMessage])
            return res.status(200).json({ roomId: newRoom.insertId })
        }

    } catch (error) {
        res.status(500).json(error)
    }
}