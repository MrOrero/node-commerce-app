const express = require('express')


const shopController = require('../controllers/shop')
const auth = require('../middleware/auth')

const router = express.Router()

router.get('/', shopController.getIndex)

router.get('/products', shopController.getProducts)

// // must be before what's beneath
// //router.get('/products/delete')

router.get('/products/:productId', shopController.getProduct)

router.post('/cart', auth, shopController.postCart)

router.get('/cart', auth, shopController.getCart)

router.post('/create-order', auth, shopController.postOrder)

router.get('/orders', auth, shopController.getOrders)

router.get('/orders/:orderId', auth, shopController.getInvoice)

router.get('/checkout', auth, shopController.getCheckout)

router.get('/checkout/success', auth, shopController.getCheckoutSuccess)

router.get('/checkout/cancel', auth, shopController.getCheckout)

router.post('/cart-delete-item', auth, shopController.postDeleteCartItem)

module.exports = router