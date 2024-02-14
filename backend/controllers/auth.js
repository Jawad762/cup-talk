import bcrypt from 'bcrypt'
import db from '../db.js'

export const signup = async (req, res) => {
    try {
        const { username, password } = req.body

        const [ doesUserExist ] = await db.query('SELECT username from `users` where username = ?', [ username ])
        if (doesUserExist.length > 0) return res.status(400).json('An account with this username already exists.')

        const hashedPassword = bcrypt.hashSync(password, 10)
        await db.query('INSERT INTO `users` (username, password) VALUES (?, ?)', [ username, hashedPassword ])
        const [ user ] = await db.query('SELECT * FROM `users` WHERE username = ?', [ username ])
        req.session.userId = user[0].userId

        // automatically add user to the global chat
        await db.query(`INSERT INTO room_participants (roomId, userId) VALUES (?,?)`,[39, user[0].userId])
        
        res.status(200).json(user[0])
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const signin = async (req, res) => {
    try {
        const { username, password } = req.body

        const [ user ] = await db.query('SELECT * FROM `users` WHERE username = ?', [ username ])
        if (!user.length) return res.status(400).json('Incorrect username or password')

        const isPasswordCorrect = await bcrypt.compare(password, user[0].password)
        if (!isPasswordCorrect) return res.status(400).json('Incorrect username or password')

        req.session.userId = user[0].userId

        res.status(200).json(user[0])
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

export const signout = (req, res) => {
    req.session.userId = null;
    res.clearCookie('userId', { path: '/' })
    req.session.destroy((err) => {
      if (err) {
        return res.status(400).end();
      } else {
        return res.status(200).end();
      }
    });
}

export const checkAuth = async (req, res) => {
    if (!req.session || !req.session.userId) {
        res.status(401).json('unauthorized');
    } else {
        res.status(200).json('authorized')
    }
};



