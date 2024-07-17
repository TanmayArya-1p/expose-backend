const mongoose = require('mongoose')

const UserSchema = mongoose.Schema({
    "pubkey" : String
})

const RequestSchema = mongoose.Schema({
    "to" : mongoose.Schema.ObjectId , "from" : mongoose.Schema.ObjectId , "req": String , "ts" : Number
})

const ImageSchema = mongoose.Schema({
    "hash" : String , "size" : Number , "ts" : Number , "seed" : mongoose.Schema.ObjectId
})

const SessionSchema = new mongoose.Schema(
    {
        "users" : [UserSchema],
        "auth" : String,
        "images" : [ImageSchema],
        "pending_requests" : [RequestSchema],
        "lastInteraction" : Number
    }
)


const Session = mongoose.model("Session", SessionSchema);
const User = mongoose.model("User", UserSchema);
const Request = mongoose.model("Request", RequestSchema)
const Image = mongoose.model("Image", ImageSchema)

module.exports = {Session, User, Request , Image}