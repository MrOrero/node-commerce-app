
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDbStore = require('connect-mongodb-session')(session)
const csrf = require('csurf')
const flash = require('connect-flash')
const multer = require('multer')

const errorController = require('./controllers/error')
const User = require('./models/user')
const Admin = require('./models/admin')



const MongoDbURI = 'MONGODBURL'

const app = express()
const sessionStore = new MongoDbStore({
    uri : MongoDbURI,
    collection: 'sessions'
})
const csrfProtection = csrf()


const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        date = Date.now()
        cb(null, date + '-' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg' ||file.mimetype === 'image/jpg' ) {
        cb(null, true)
    }else{
        cb(null, false)
    }
}
// set values globally on express application
// app.set('view engine', 'pug')
app.set('view engine', 'ejs')
app.set('views', 'views')

const adminRoutes = require('./routes/admin')
const shopRoutes = require('./routes/shop')
const authRoutes = require('./routes/auth')

app.use(express.urlencoded({extended: false}))
// app.use(multer({storage: fileStorage}).single('image'))
app.use(multer({storage: fileStorage, fileFilter:fileFilter}).single('image'))

app.use(express.static('public'))
app.use('/images', express.static('images'))

app.use(session({secret: 'Secret used for signing the hash', resave: false, saveUninitialized: false, store: sessionStore}))
app.use(csrfProtection)
app.use(flash())


app.use(async(req, res, next) =>  {
    // next (new Error('Sync dummy'))
    if (!req.session.user) {
        return next()
    }
    try{
        const user = await User.findById(req.session.user._id)
            if (!user) {
                return next()
            }
            req.user = user
            next()
    }catch(err){
        next (new Error(err))
    }
})

app.use(async(req, res, next) =>  {
    // next (new Error('Sync dummy'))
    if (!req.session.admin) {
        return next()
    }
    try{
        const admin = await Admin.findById(req.session.admin._id)
            if (!admin) {
                return next()
            }
            req.admin = admin
            next()
    }catch(err){
        next (new Error(err))
    }
})


app.use((req,res,next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn
    res.locals.csrfToken = req.csrfToken()
    next()
})

app.use('/admin',adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)

app.get('/500', errorController.get500)

app.all('*', errorController.pageNotFound)

app.use((error, req, res, next)=> {
    // res.redirect('/500')
    console.log(error)
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn,
        isAdmin: false
    })
})

// app.use((req,res,next) => {
//   res.status(404).send('<h1>Page Not Found</h1>') 
// })

mongoose.connect(MongoDbURI)
.then(result => {
    app.listen(5000)
})
.catch(err => console.log(err))

