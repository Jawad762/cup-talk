import express from 'express'
import { composeMessage, createMessage, deleteMessage,  getConversationMessages, updateSeenStatus } from '../controllers/message.js'

const router = express.Router()

// get room messages
router.get('/:roomId', getConversationMessages)

// send message (Directly from the room)
router.post('/create', createMessage)

// compose message
router.post('/compose', composeMessage)

// delete message (not actually deleting it but updating isDeleted column for the specific message, in order to display appropriate UI)
router.put('/delete/:messageId', deleteMessage)

// update seen status
router.put('/updateStatus/:roomId/:seenByUser', updateSeenStatus)

export default router