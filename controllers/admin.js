const mongoose = require('mongoose')
const {validationResult} = require('express-validator')

const fileUtil = require('../util/file')


const Product = require('../models/product')
const { file } = require('pdfkit')

const PRODUCTS_PER_PAGE = 2


exports.getAddProduct = (req,res,next) => {
    // res.sendFile(path.join(rootDir, 'views', 'add-product.html'))
    res.render('admin/add-product', {
        pageTitle: 'Add Product', 
        path: '/admin/add-product',
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: '',
        oldInput: {title: '', imageUrl: '', price: '', description: ''},
        validationErrors: [],
        isAdmin: true

    })
}

exports.postAddProduct =  (req,res,next) => {
    const title = req.body.title
    const image = req.file
    const price = req.body.price
    const description = req.body.description
    console.log(image)
    if (!image) {
        return res.status(422).render('admin/add-product',{
            pageTitle: 'Add Product', 
            path: '/admin/add-product', 
            isAuthenticated: req.session.isLoggedIn,
            errorMessage: "Attached file should be an image",
            oldInput: {title: title, price: price, description: description},
            validationErrors: [],
            isAdmin: true

        })

    }

    const errors = validationResult(req)
    
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/add-product',{
            pageTitle: 'Add Product', 
            path: '/admin/add-product', 
            isAuthenticated: req.session.isLoggedIn,
            errorMessage: errors.array()[0].msg,
            oldInput: {title: title, price: price, description: description},
            validationErrors: errors.array(),
            isAdmin: true

        })
    }
    const imageUrl = image.path
    // if (title.length > 0) {
        //createProduct because our model is named Product
        const product = new Product({
            // _id: mongoose.Types.ObjectId('62c94d10e06bc79d1bc8a371'),
            title: title,
            price: price,
            description: description,
            imageUrl: imageUrl,
            userId: req.admin
        })
        product.save()
        .then(() => {
            res.redirect('/admin/products')
            console.log('Created Product')})
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        })
    // }



}

exports.getEditProduct = (req,res,next) => {
    // res.sendFile(path.join(rootDir, 'views', 'add-product.html'))
    const editMode = req.query.edit
    if (!editMode) {
        return res.redirect('/admin/products')
    }
    const productId = req.params.productId
    Product.findById(productId)
        .then(product => {
                if (!product) {
                console.log('No product with that Id')
                return res.redirect('/admin/products')
            }
        res.render('admin/edit-product', {
            pageTitle: 'Edit Product', 
            path: '/admin/edit-product', 
            // editing: editMode,
            product: product, 
            isAuthenticated: req.session.isLoggedIn,
            validationErrors: [],
            errorMessage: null,
            isAdmin: true

            })
        })
        .catch(err => {
            const error = new Error(err)
            error.httpStatusCode = 500
            return next(error)
        })
    
    // req.session.user.getProducts({where: {id: productId}})
    //     .then(products => {
    //         const product = products[0]
    //         if (!product) {
    //             console.log('No product with that Id')
    //             return res.redirect('/')
    //         }
    //     res.render('admin/edit-product', {pageTitle: 'Edit Product', path: '/admin/edit-product', editing: editMode, product: product})
    //     })
    //     .catch(err => console.log(err)) 

}

exports.postEditProduct = async (req, res, next) => {
    const {productId} = req.body
    const {title} = req.body
    const {price} = req.body
    const image = req.file
    const {description} = req.body
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product',{
            pageTitle: 'Edit Product', 
            path: '/admin/edit-product', 
            isAuthenticated: req.session.isLoggedIn,
            errorMessage: errors.array()[0].msg,
            // editing: editMode,
            product: {title: title, price: price, description: description, _id: productId},
            validationErrors: errors.array(),
            isAdmin: true

        })
    }


    try {
        const product = await Product.findById(productId)
        if (product.userId.toString() !== req.admin._id.toString()) {
            return res.redirect('/admin/products')
        }
        product.title = title
        product.price = price
        product.description = description
        if(image) {    
            fileUtil.deleteFile(product.imageUrl)
            product.imageUrl = image.path
        }
    
        await product.save()
        res.redirect('/admin/products')
        console.log('Updated Sucessfully')        
    } catch (err) {
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)
    }

    // Product.findByIdAndUpdate(productId,{
    //     title: title,
    //     price: price,
    //     description: description,
    //     imageUrl: imageUrl
    // })
    // // product.save()
    // .then(() => {
    //     res.redirect('/admin/products')
    //     console.log('Updated Sucessfully')

    // })
    // .catch(err => console.log(err))

}

exports.deleteProduct = async (req, res, next) => {
    try {
        const {productId} = req.params
        const product = await Product.findById(productId)
        if (!product) {
            return next(new Error('Product not Found'))
        }
        fileUtil.deleteFile(product.imageUrl)
        await Product.deleteOne({_id: productId ,userId: req.admin._id})
        res.status(200).json({message: 'Deleted Sucessfully'})
        console.log('Deleted Successfully')    
    } catch (err) {
        res.status(500).json({message: 'Deleting Product failed'})
            // const error = new Error(err)
            // error.httpStatusCode = 500
            // return next(error)
    }
}

exports.getProducts = async (req,res,next) => {
    const page = +req.query.page || 1
    try {
        const totalProducts = await Product.find().countDocuments()
        const products = await Product.find().skip((page - 1) * PRODUCTS_PER_PAGE).limit(PRODUCTS_PER_PAGE)
        // .select('title price -id')
        // .populate('userId')

        res.render('admin/products', 
        {
            productKey: products, 
            pageTitle: 'Admin Products', 
            path :'/admin/products', 
            isAuthenticated: req.session.isLoggedIn, 
            totalProducts: totalProducts,
            currentPage: page,
            nextPage: page + 1,
            hasNextPage: page * PRODUCTS_PER_PAGE < totalProducts,
            previousPage: page - 1 ,
            hasPreviousPage: page > 1,
            lastPage: Math.ceil(totalProducts/PRODUCTS_PER_PAGE),
            isAdmin: true
        })     
    } catch (err) {
        console.log(err)
        const error = new Error(err)
        error.httpStatusCode = 500
        return next(error)   
    }
} 

    


