const path = require('path')

exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500',
        isAuthenticated: req.session.isLoggedIn,
        isAdmin: false
    })
}

exports.pageNotFound = (req,res) => {
    res.status(404).sendFile(path.join(__dirname, '..' ,'views', '404.html')) 
}