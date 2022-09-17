const crypto = require('crypto')

const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const {validationResult} = require('express-validator')

const User = require('../models/user')

// let transporter = nodemailer.createTransport({
//     service: "Gmail", // no need to set host or port etc.
//     auth: {
//         user: 'oreroozore@gmail.com',
//         pass: 'rcjrpjfvftdqgqwm'
//     }
// });

let transporter = nodemailer.createTransport({
    service: 'SendPulse', 
    auth: {
        user: 'oreroozore@gmail.com',
        pass: 'RWc23cWkP4DZkHf'
    }
});

exports.getSignup = (req, res, next) => {
    let message = req.flash('error')
    if (message.length > 0) {
        message = message[0]
    }else{
        message = null
    }

    res.render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage:message,
      oldInput: {email: "", password: ""},
      validationErrors: []
    });
};

exports.postSignup = async (req, res, next) => {
    const {email} = req.body
    const {password} = req.body
    const errors = validationResult(req)
    // console.log(errors.array())
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage:errors.array()[0].msg,
            oldInput: {email: email, password:password},
            validationErrors: errors.array()
        })
    }
    try {
        const hashedPassword = await bcrypt.hash(password,12)
        const user = new User({
            password: hashedPassword,
            email: email,
            cart: {items: []}
        })
        await user.save()
        await transporter.sendMail({
            to: email,
            from: 'oozore@quales.tech',
            subject: 'Signup suceeded',
            text: 'You succesfully signed up'
        })
        console.log('email sent')
        res.redirect('/login')
                   
    } catch (err) {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
    }


};


exports.getLogin = (req,res,next) => {
    // const isLoggedIn = req.get('Cookie').split('=')[1].trim() === 'true'
    let message = req.flash('error')
    if (message.length > 0) {
        message = message[0]
    }else{
        message = null
    }
    let passwordSuccess = req.flash('passwordSuccessful')
    if (passwordSuccess.length > 0) {
        passwordSuccess = passwordSuccess[0]
        console.log(passwordSuccess)
    }else{
        passwordSuccess = null
    }

    res.render('auth/login', {path: '/login', pageTitle: 'Login',  errorMessage:message, passwordMessage: passwordSuccess, email: '',validationErrors: [], isAdmin:false
})
}

  
exports.postLogin = async (req,res,next) => {
    // res.setHeader('Set-Cookie', 'loggedIn=true')
    const {email} = req.body
    const {password} = req.body
    const errors = validationResult(req)
    // console.log(errors.array())
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage:errors.array()[0].msg,
            passwordMessage: null,
            email: email,
            validationErrors: errors.array()
        })
    }
    try{
            const user = await User.findOne({email: email})
            const doMatch =await bcrypt.compare(password, user.password)
            if (doMatch) {
            req.session.user = user
            req.session.isLoggedIn = true
            return req.session.save((err) => {
                console.log(err)
                res.redirect('/')
            })
            }else{
                // console.log('invalid password')
                return res.status(422).render('auth/login', {
                    path: '/login',
                    pageTitle: 'Login',
                    errorMessage:'Invalid email or password',
                    passwordMessage: null,
                    email: email,
                    validationErrors: []
                })
            }
    }catch(err){
        console.log(err)
        res.redirect('/login')
    }
}


exports.postLogout = (req,res,next) => {
    req.session.destroy((err) => {
        console.log(err)
        res.redirect('/')
    })
}

exports.getReset = (req,res,next) => {
    let message = req.flash('error')
    if (message.length > 0) {
        message = message[0]
    }else{
        message = null
    }
    res.render('auth/password-reset', {path: '/password-reset', pageTitle: 'Reset Password',  errorMessage:message})
}

exports.postReset = async (req,res,next) => {
    crypto.randomBytes (32,  async (err, buffer) => {
        if (err) {
            console.log(err)
            return res.redirect('/reset')
        }
        const token = buffer.toString('hex')
        try {
            const user = await User.findOne({email: req.body.email})
            if(!user){
                req.flash('error', "Email doesn't exist")
                res.redirect('/reset')
            }
            user.resetToken = token
            user.resetTokenExpiration = Date.now() + 3600000
            await user.save()
            res.redirect('/login')
            await transporter.sendMail({
                to: req.body.email,
                from: 'oozore@quales.tech',
                subject: 'Password Reset',
                html: `
                    <p> Ignore this mail if you did not request a password reset </p>
                    <p> Click this <a href = http://localhost:5000/reset/${token}> https://localhost:5000/reset/${token} </a> to set a new password </p>
                    <p> Link expires in one hour </p>
                `
            })
    

        }catch (err) {
                const error = new Error(err)
                error.httpStatusCode = 500
                return next(error)
            }
    })
}
exports.getChangePassword = (req,res,next) => {
    const token = req.params.resetToken
    // console.log(token)
    // let message = req.flash('message')
    // if (message.length > 0) {
    //     message = message[0]
    // }else{
    //     message = null
    // }
    // console.log(message)
    res.render('auth/change-password', {path: '/change-password', pageTitle: 'Change Password',  passwordToken: token})

}

exports.postChangePassword = async (req,res,next) => {
    const {token} = req.body
    // console.log(token)
    try {
        const user = await User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
        if (user) {
            console.log(user)
            const {password} = req.body
            const hashedPassword = await bcrypt.hash(password,12)
            const updatedUser = await User.findByIdAndUpdate(user._id, {
                password: hashedPassword,
            })
            updatedUser.resetToken = undefined
            updatedUser.resetTokenExpiration = undefined
            // console.log(updatedUser)
            await updatedUser.save()
            req.flash('passwordSuccessful', "Password Sucessfully Updated")  
            // setTimeout(() => {
                res.redirect('/login')
            // }, 5000)
                    
        }
        
    } catch (err) {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        }
}
