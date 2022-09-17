const crypto = require('crypto')

const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const {validationResult} = require('express-validator')

const Admin = require('../models/admin')


exports.getAdminLogin = async (req,res,next)=> {
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

    res.render('auth/admin-login', {path: '/admin-login', pageTitle: 'Admin Login', 
     errorMessage:message, passwordMessage: passwordSuccess, email: '',validationErrors: [],
     isAdmin: true
    })

}

exports.postAdminLogin = async (req,res,next) => {
    const email = 'admin@admin.com'
    const password = 'admin'

    
    try {
        const admin = await Admin.findOne({email: email})
        const doMatch =await bcrypt.compare(password, admin.password)
        if (doMatch) {
        req.session.admin = admin
        req.session.isLoggedIn = true
        req.session.isAdmin = true
        return req.session.save((err) => {
            console.log(err)
            res.redirect('/admin/products')
        })
        }else{
            const hashedPassword = await bcrypt.hash(password,12)
            const admin = new Admin({
                password : hashedPassword,
                email : email
            })
        
            await admin.save()                   

            return res.status(422).render('auth/admin-login', {
                path: '/login',
                pageTitle: 'Login',
                errorMessage:'Invalid email or password',
                passwordMessage: null,
                email: email,
                validationErrors: [],
                isAdmin: true
            })
        }


        if(!admin){
            const hashedPassword = await bcrypt.hash(password,12)
            const admin = new Admin({
                password : hashedPassword,
                email : email
            })
        
            await admin.save()                   
        }
        
        console.log('here2')
        res.redirect('/admin/products')

    } catch (err) {
        console.log(err)
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    }

}
