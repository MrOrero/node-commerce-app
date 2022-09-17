const express = require('express')
const {body} = require('express-validator') //body,param,query,cookie,header

const adminController = require('../controllers/admin')
const auth = require('../middleware/auth')
const isAdmin = require('../middleware/isAdmin')
const Product = require('../models/product')

const router = express.Router()

// /admin/add-product => GET
router.get('/add-product', auth, isAdmin, adminController.getAddProduct)
  
router.get('/products', auth ,isAdmin, adminController.getProducts)

router.post('/add-product', auth, isAdmin,
body('title','The title should have words you fool (Not more than 20 tho)').isString().ltrim().rtrim().isLength({min:1, max:20}),
body('price', 'Price should be a valid number').trim().isNumeric(),
body('description', 'Description is too short').ltrim().rtrim().isLength({min:5, max:400})
,adminController.postAddProduct)

router.get('/edit-product/:productId', auth, isAdmin,adminController.getEditProduct)

router.post('/edit-product', auth, isAdmin,
body('title','The title should have words you fool (Not more than 20 tho)').isString().ltrim().rtrim().isLength({min:1, max:20}),
body('price', 'Price should be a valid number').trim().isNumeric(),
body('description', 'Description is too short').ltrim().rtrim().isLength({min:5, max:400}),
adminController.postEditProduct)

router.delete('/products/:productId', auth, isAdmin, adminController.deleteProduct)
  
module.exports = router