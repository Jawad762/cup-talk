import express from 'express'
import { signin, signout, signup, checkAuth } from '../controllers/auth.js'
import { checkUsername } from '../controllers/user.js'

const router = express.Router()

// signup
router.post('/signup', signup)

// signin
router.post('/signin', signin)

// check auth
router.get('/check-auth', checkAuth)

// signout
router.post('/signout', signout)

// check username availability
router.get('/username/:username', checkUsername)

export default router