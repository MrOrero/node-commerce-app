const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({ 
    email:{
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart:{
        items: [{productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product' ,required: true}, 
        quantity: {type: Number, required: true}}]
    }
})

userSchema.methods.addToCart = function (product) {
        const cartProductIndex = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString()
        })
        let newQuantity = 1
        const updatedCartItems = [...this.cart.items]
        
        if (cartProductIndex >= 0) {
            newQuantity =this.cart.items[cartProductIndex].quantity + 1
            updatedCartItems[cartProductIndex].quantity = newQuantity
        }else{
            updatedCartItems.push({productId: product._id, quantity: newQuantity})
        }
        const updatedCart = {items : updatedCartItems}
        // const updatedCart = {items : [{productId: new ObjectId(product._id), quantity:1}]}
        this.cart = updatedCart
        this.save()
}

userSchema.methods.deleteCartItem = function (productId) {
        const updatedCartItems = this.cart.items.filter(item => {
            return item.productId.toString() !== productId.toString()
        })

        const updatedCartItemIndex = this.cart.items.findIndex(item => {
            return item.productId.toString() === productId.toString()
        })

        const updatedCartItemss = [...this.cart.items]

        if (updatedCartItemss[updatedCartItemIndex].quantity > 1) {
            const newQuantity = updatedCartItemss[updatedCartItemIndex].quantity - 1
            updatedCartItemss[updatedCartItemIndex].quantity = newQuantity
            this.cart.items = updatedCartItemss
            return this.save()
            // console.log('remove 1 quantity')
        }else{
            this.cart.items = updatedCartItems
            return this.save()
            // console.log('delete item')
        }
}

userSchema.methods.clearCart = function(){
    this.cart = {items : []}
    return this.save()
}

module.exports = mongoose.model('User', userSchema)
// const mongodb = require('mongodb')
// const ObjectId = mongodb.ObjectId

// const getDb = require('../util/database').getDb

// class User {
//     constructor(username, email, cart, _id){
//         this.username = username
//         this.email = email
//         this.cart = cart
//         this._id = _id
//     }

//     save (){
//         const db = getDb()
//         return db.collection('users').insertOne(this)
//         .then(result => console.log(result))
//         .catch(err => console.log(err))

//     }

//     addToCart(product){
//         const cartProductIndex = this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString()
//         })
//         let newQuantity = 1
//         const updatedCartItems = [...this.cart.items]
        
//         if (cartProductIndex >= 0) {
//             newQuantity =this.cart.items[cartProductIndex].quantity + 1
//             updatedCartItems[cartProductIndex].quantity = newQuantity
//         }else{
//             updatedCartItems.push({productId: product._id, quantity: newQuantity})
//         }
//         const updatedCart = {items : updatedCartItems}
//         // const updatedCart = {items : [{productId: new ObjectId(product._id), quantity:1}]}
//         const db = getDb()
//         return db.collection('users').updateOne({_id: new ObjectId(this._id)}, {$set: {cart: updatedCart}})
//     }
    
//     getCart(){
//         const db = getDb()
//         const productIds = this.cart.items.map(index => {
//             return index.productId
//         })
//         // console.log(productIds)

//         return db.collection('products').find({_id: {$in : productIds}})
//         .toArray()
//         .then(products => {
//             // console.log(products)
//             return products.map(p => {
//                 return {...p, quantity: this.cart.items.find(i => {
//                   return i.productId.toString() === p._id.toString()  
//                 }).quantity
//                 }
//             })
//         })
//     }

//     deleteCartItem(productId){
//         const updatedCartItems = this.cart.items.filter(item => {
//             return item.productId.toString() !== productId.toString()
//         })

//         const updatedCartItemIndex = this.cart.items.findIndex(item => {
//             return item.productId.toString() === productId.toString()
//         })

//         const updatedCartItemss = [...this.cart.items]

//         if (updatedCartItemss[updatedCartItemIndex].quantity > 1) {
//             const newQuantity = updatedCartItemss[updatedCartItemIndex].quantity - 1
//             updatedCartItemss[updatedCartItemIndex].quantity = newQuantity
//             const db = getDb()
//             return db.collection('users').updateOne({_id: new ObjectId(this._id)}, {$set: {cart: {items :updatedCartItemss}}})
//             // console.log('remove 1 quantity')
//         }else{
//             const db = getDb()
//             return db.collection('users').updateOne({_id: new ObjectId(this._id)}, {$set: {cart: {items:updatedCartItems}}})
//             // console.log('delete item')
//         }
//     }

//     addOrder(){
//         const db = getDb()
//         return this.getCart().then(products => {
//             const order = {
//                 items: products,
//                 user: {
//                     _id: new ObjectId(this._id),
//                     name: this.username
//                 }
//             }
//             return db.collection('orders').insertOne(order)

//         })
//         .then(result => {
//             this.cart = {cart : {items : []}}
//             return db.collection('users').updateOne({_id: new ObjectId(this._id)}, {$set: {cart: {items: []}}})

//         })
//     }

//     getOrders(){
//         const db = getDb()
//         return db.collection('orders').find({'user._id' : new ObjectId(this._id)}).toArray()
//     }

//     static findById(userId){
//         const db = getDb()
//         return db.collection('users').find({_id : new mongodb.ObjectId(userId)})
//         .next()
//         .then(user=> {
//             // console.log(user)
//             return user
//         })
//         .catch(err => console.log(err))
//     }
// }

// module.exports = User
