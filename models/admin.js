const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const adminSchema = new mongoose.Schema({ 
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
})

adminSchema.methods.initialize = async function(){
    const email = 'admin@admin.com'
    const password = 'admin'
    try {
        const hashedPassword = await bcrypt.hash(password,12)
        this.password = hashedPassword
        this.email = email
        this.save()                   
    } catch (err) {
        console.log(err)
    }

}


module.exports = mongoose.model('Admin', adminSchema)
