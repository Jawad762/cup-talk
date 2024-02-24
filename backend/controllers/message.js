import { decryptMessage, encryptMessage } from '../crypto.js'
import db from '../db.js'

export const getConversationMessages = async (req, res) => {
    try {
        const { roomId } = req.params
        const [data] = await db.query(`
        SELECT
            messages.messageId,
            messages.senderId,
            messages.text,
            messages.image,
            messages.roomId,
            messages.isDeleted,
            DATE_FORMAT(messages.date, '%Y-%m-%d %H:%i:%s') AS date,
            messageUsers.username,
            messageUsers.profilePicture AS userProfilePicture,
            GROUP_CONCAT(seen_messages.seenBy) AS seenBy,
            parentMessages.senderId as parentSender,
            parentMessages.messageId as parentId,
            parentMessages.text as parentText,
            parentMessages.image as parentImage,
            parentUsers.username as parentUsername
        FROM messages
        JOIN users as messageUsers ON messageUsers.userId = messages.senderId
        LEFT JOIN seen_messages ON seen_messages.messageId = messages.messageId
        LEFT JOIN messages as parentMessages ON parentMessages.messageId = messages.parentId
        LEFT JOIN users as parentUsers ON parentUsers.userId = parentMessages.senderId
        WHERE messages.roomId = ?
        GROUP BY messages.messageId
        ORDER BY messages.date DESC
        LIMIT 500
    `, [roomId]);
    
        const decryptedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date)).map(message => {
            return {
                ...message,
                text: decryptMessage(message.text),
                parentText: decryptMessage(message.parentText),
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
        const { roomId, text, image, parentId, senderId } = req.body
        console.log(senderId)
        const encryptedMessage = encryptMessage(text)
        await db.query('INSERT INTO messages (senderId, roomId, text, image, parentId) VALUES (?, ?, ?, ?, ?)' , [senderId, roomId, encryptedMessage, image, parentId])
        res.status(200).json('Message sent successfully')
    } catch (error) {
        console.error(error)
        res.status(500).json(error)
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params
        const userId = req.session.userId
        await db.query(`UPDATE messages SET isDeleted = true WHERE messageId = ? AND senderId = ?`, [messageId, userId])
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
        DISTINCT messageId 
        FROM messages 
        WHERE senderId != ? AND roomId = ? AND messageId NOT IN (
            SELECT DISTINCT messageId FROM seen_messages WHERE seenBy = ?
        )
        `, [seenByUser, roomId, seenByUser])
        const allPromises = seenMessages.map(async (message) => {
            console.log(message.messageId)
            await db.query(`INSERT INTO seen_messages (messageId, seenBy) VALUES (?, ?)`, [message.messageId, Number(seenByUser)])
        })
        await Promise.all(allPromises)
        res.status(200).end()
    } catch (error) {
        res.status(500).json(error)
    }
}

export const composeMessage = async (req, res) => {
    try {
        const { messageText, receiverId } = req.body
        const senderId = req.session.userId
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
            const [ data ] = await db.query(`INSERT INTO messages (senderId, roomId, text) VALUES (?, ?, ?)`, [senderId, doesRoomExist[0].roomId, encryptedMessage])
            const [ message ] = await db.query('SELECT * FROM messages WHERE messageId = ?', [data.insertId])
            return res.status(200).json({...message[0], text: decryptMessage(message[0].text)})
        }

        else {
            const [ newRoom ] = await db.query(`INSERT INTO rooms (roomId, type) VALUES (DEFAULT, 'private')`)
            await db.query(`
             INSERT INTO room_participants (roomId, userId) VALUES
             (?, ?),
             (?, ?)
             `, [newRoom.insertId, senderId, newRoom.insertId, receiverId])
            const [ data ] = await db.query(`INSERT INTO messages (senderId, roomId, text) VALUES (?, ?, ?)`, [senderId, newRoom.insertId, encryptedMessage])
            const [ message ] = await db.query('SELECT * FROM messages WHERE messageId = ?', [data.insertId])
            return res.status(200).json({...message[0], text: decryptMessage(message[0].text)})
        }

    } catch (error) {
        res.status(500).json(error)
    }
}