const fs = require('fs')
const path = require('path')

const stripe = require('stripe')('sk_test_51LMwKIL7DxjpWU9T4om1XdEs2hg34gXAspfbuvyZZ2uXA6EuSv2ZbwvJKLMndR9LSaB0T8zeqkBSA1EKbsITGwdZ00wXIVfmgK')
const PdfDocument = require('pdfkit')

const Product = require('../models/product')
// const Cart = require('../models/cart')
const Order = require('../models/order')

const PRODUCTS_PER_PAGE = 2




exports.getProducts =async (req,res,next) => {
    const page = +req.query.page || 1
    try {
        const totalProducts = await Product.find({userId: req.admin._id}).countDocuments()
        const products = await Product.find({userId: req.admin._id}).skip((page - 1) * PRODUCTS_PER_PAGE).limit(PRODUCTS_PER_PAGE)
        res.render('shop/product-list', 
        {
            productKey: products, 
            pageTitle: 'All Products', 
            path :'/products', 
            isAuthenticated: req.session.isLoggedIn, 
            isAdmin: false,
            totalProducts: totalProducts,
            currentPage: page,
            nextPage: page + 1,
            hasNextPage: page * PRODUCTS_PER_PAGE < totalProducts,
            previousPage: page - 1 ,
            hasPreviousPage: page > 1,
            lastPage: Math.ceil(totalProducts/PRODUCTS_PER_PAGE)
        })     
    } catch (err) {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)   
    }
} 

exports.getProduct = (req,res,next) => {
    // console.log(req.params)
    const productId = req.params.productId
    Product.findById(productId)
        .then(product => {res.render('shop/product-detail', {product: product, isAdmin: false,
            pageTitle: product.title, path: '/products', isAuthenticated: req.session.isLoggedIn})})
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        })
}

exports.getIndex = async (req,res,next) => {
    const page = +req.query.page || 1
    try {
        const totalProducts = await Product.find().countDocuments()
        const products = await Product.find().skip((page - 1) * PRODUCTS_PER_PAGE).limit(PRODUCTS_PER_PAGE)
        res.render('shop/index', 
        {
            productKey: products, 
            pageTitle: 'Shop', 
            path :'/', 
            isAuthenticated: req.session.isLoggedIn, 
            isAdmin: false,
            totalProducts: totalProducts,
            currentPage: page,
            nextPage: page + 1,
            hasNextPage: page * PRODUCTS_PER_PAGE < totalProducts,
            previousPage: page - 1 ,
            hasPreviousPage: page > 1,
            lastPage: Math.ceil(totalProducts/PRODUCTS_PER_PAGE)
        })     
    } catch (err) {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)   
    }


}

exports.getCart = (req,res,next) => {
    req.user.populate('cart.items.productId')
        .then(user => {
            // console.log(user.cart.items)
            const products = user.cart.items
            res.render('shop/cart', {path: '/cart', pageTitle: 'Your Cart', products: products, isAuthenticated: req.session.isLoggedIn, isAdmin: false})

        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        })
        
        // [
        //     {
        //       productId: {
        //         _id: new ObjectId("62c2ff062bd6bcd34b6329eb"),
        //         title: 'A book',
        //         price: 11.99,
        //         description: 'Must Read',
        //         imageUrl: 'https://i0.wp.com/thebftonline.com/wp-content/uploads/2020/12/books.jpeg?fit=1024%2C640&ssl=1',
        //         userId: new ObjectId("62c2ecba0db749658f94f5c9"),
        //         __v: 0
        //       },
        //       quantity: 2,
        //       _id: new ObjectId("62c302b909b0059f48972b17")
        //     }
        //   ]
}

exports.postCart = (req , res ,next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
    .then(product => {
        return req.user.addToCart(product)
    })
    .then(result => {
        res.redirect('/cart')
        console.log(result)
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

exports.getCheckout = async (req, res, next) => {
    try {
        let products;
        let total = 0;
        const user = await req.user.populate('cart.items.productId')
            products = user.cart.items;
            total = 0;
            products.forEach(p => {
              total += p.quantity * p.productId.price;
            });
      
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card'],
              line_items: products.map(p => {
                return {
                  name: p.productId.title,
                  description: p.productId.description,
                  amount: p.productId.price * 100,
                  currency: 'usd',
                  quantity: p.quantity
                };
              }),
              success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
              cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
            });
            res.render('shop/checkout', {
              path: '/checkout',
              pageTitle: 'Checkout',
              products: products,
              totalSum: total,
              sessionId: session.id,
              isAdmin: false
            });
    
    } catch (err) {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
        
    }
};

exports.getCheckoutSuccess = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .then(user => {
        const products = user.cart.items.map(i => {
            return {product: {...i.productId._doc}, quantity: i.quantity}
        })
        const order = new Order({
            products: products,
            user:{
                email: req.user.email,
                userId: req.user
            }
        })
        return order.save()
    })
    .then(()=> {
            return req.user.clearCart()
    })
    .then(()=> {
        res.redirect('/orders')
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}


  
exports.postDeleteCartItem = (req,res, next ) => {
    const {productId} = req.body
    req.user.deleteCartItem(productId)
    .then(() => {
        res.redirect('/cart')
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

exports.postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId')
    .then(user => {
        const products = user.cart.items.map(i => {
            return {product: {...i.productId._doc}, quantity: i.quantity}
        })
        const order = new Order({
            products: products,
            user:{
                email: req.user.email,
                userId: req.user
            }
        })
        return order.save()
    })
    .then(()=> {
            return req.user.clearCart()
    })
    .then(()=> {
        res.redirect('/orders')
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

exports.getOrders = (req,res,next) => {
    Order.find({'user.userId' : req.user._id})
    .then(orders => {
        console.log(orders);
        res.render('shop/orders', {path: '/orders', pageTitle: 'Your Orders', orders: orders, isAuthenticated: req.session.isLoggedIn, isAdmin: false})
    })
    .catch(err => {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    })
}

exports.getInvoice = async(req,res,next) => {
    const {orderId} = req.params
    try {
        const order = await Order.findById(orderId)
        if(!order){
            console.log('no such order')
            return next(new Error ('No such order'))
        }
        if (order.user.userId.toString() !== req.user._id.toString()) {
            //change to unauthorized user http response
            console.log('unauthorized user')
            return next(new Error ('Unauthorized user'))
        }
        const invoiceName = 'invoice-' + orderId + '.pdf' 
        const invoicePath = path.join(path.dirname(require.main.filename) , 'data', 'invoices', invoiceName)

        const pdfDoc = new PdfDocument()
        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', 'inline; filename = "'+ invoiceName +'"')
        pdfDoc.pipe(fs.createWriteStream(invoicePath))
        pdfDoc.pipe(res)

        pdfDoc.fontSize(26).text('Invoice', { underline: true});
        pdfDoc.text('-----------------------');
        let totalPrice = 0;
        order.products.forEach(prod => {
        totalPrice += prod.quantity * prod.product.price;
        pdfDoc
            .fontSize(14)
            .text(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
        });
        pdfDoc.text('---');
        pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
    
        pdfDoc.end()
        // fs.readFile(invoicePath, (err, data) => {
        //     if (err) {
        //         console.log(err)
        //         return next(err)
        //     }
        //     res.setHeader('Content-Type', 'application/pdf')
        //     res.setHeader('Content-Disposition', 'inline; filename = "'+ invoiceName +'"')
        //     res.send(data)
        // })    
        // const file = fs.createReadStream(invoicePath)
        // res.setHeader('Content-Type', 'application/pdf')
        // res.setHeader('Content-Disposition', 'inline; filename = "'+ invoiceName +'"')
        // file.pipe(res)
    } catch (error) {
        return next(error)
    }
}

// exports.getCheckout = (req, res, next) => {
//     res.render('/shop/checkout', {path: '/checkout', pageTitle: 'Checkout'})
// }