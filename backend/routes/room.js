import express from 'express'
import { createPrivateRoom, findUserRooms, createGroup, updateGroupDescription, updateGroupProfilePicture, exitGroup, addUsersToGroup } from '../controllers/room.js'

const router = express.Router()

// find rooms
router.get('/get/:userId', findUserRooms)

// create private room
router.post('/create', createPrivateRoom)

// create group
router.post('/create-group', createGroup)

// update group description
router.put('/update-description/:roomId', updateGroupDescription)

// update group profile picture
router.put('/update-pfp/:roomId', updateGroupProfilePicture)

// add users to group
router.post('/add-users-to-group', addUsersToGroup)

// exit group
router.delete('/exit-group/:userId/:roomId', exitGroup)

export default router