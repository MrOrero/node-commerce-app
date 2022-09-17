const express = require('express')
const {check, body} = require('express-validator') //body,param,query,cookie,header

const authController = require('../controllers/auth')
const adminAuthController = require('../controllers/admin-auth')

const User = require('../models/user')

const router = express.Router()

router.get('/signup', authController.getSignup);

router.post('/signup', 
[
    check('email').isEmail().withMessage('Please enter a valid email')
    .custom(async (value, {req})=>  {
        const existingUser = await User.findOne({email: value})
        if (existingUser) {
            throw new Error('User already exists')
        }
        return true
    }).normalizeEmail(),
    body('password', 'Password should be at least 5 characters long').isLength({min:5}).trim(),
    body('confirmPassword').trim().custom((value, {req})=> {
    if (value !== req.body.password) {
        throw new Error('Passwords have to match')
    }
    return true;
})
]
, authController.postSignup
);
router.get('/admin/login', adminAuthController.getAdminLogin)

router.post('/admin/login', adminAuthController.postAdminLogin)

router.get('/login', authController.getLogin)

router.post('/login',
body('email').isEmail().withMessage('Please enter a valid email').custom(async(value, {req}) => {
    const user = await User.findOne({email: value})
    if (!user) {
        throw new Error('User does not exist')
    }
    return true
}).normalizeEmail(),
body('password').isLength({min:5}).withMessage('Password should be at least 5 characters long').trim(),
authController.postLogin)

router.post('/logout', authController.postLogout)

router.get('/reset', authController.getReset)

router.post('/reset', authController.postReset)

router.get('/reset/:resetToken', authController.getChangePassword)

router.post('/reset/changePassword', authController.postChangePassword)

module.exports = router