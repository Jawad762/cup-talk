import express from 'express'
import { findUser, updateDescription, updateProfilePicture, updateUsername, searchUsers, findUsersFromRoom, updateOnlineStatus, banUser, addUserStrikes, subscribeUser, sendNotification } from '../controllers/user.js'
const router = express.Router()

// find user
router.get('/:userId', findUser)

// find users from room
router.get('/find/:roomId/:currentUserId/:limit', findUsersFromRoom)

// search for users
router.get('/search/:userId/:input', searchUsers)

// update user profile picture
router.put('/updateProfile/:userId', updateProfilePicture)

// update user username
router.put('/updateUsername/:userId', updateUsername)

// update user description
router.put('/updateDescription/:userId', updateDescription)

// update user status
router.put('/updateStatus/:userId', updateOnlineStatus)

// add user strike
router.put('/strike/:userId', addUserStrikes)

// ban user
router.delete('/ban/:userId', banUser)

// subscribe user to notifications
router.post('/subscribe', subscribeUser)

router.post('/sendNotification', sendNotification)

export default router
