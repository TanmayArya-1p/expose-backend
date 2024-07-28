const express = require('express')
const crypto = require('crypto')
const util = require('util')

const models = require('./models.js')
const Session = models.Session
const User = models.User
const Request = models.Request
const Image = models.Image

const cryptography = require('./cryptography.js')

const router = express.Router()

const HardAuthVerify = async (body , sessionID , userObject) => cryptography.verifyMessage(userObject.pubkey,sessionID + ":" + userObject.id ,body)
async function HardCheck(req,res,next) {
    console.log(req.body)
    let ses = await Session.findById(req.params.sid)
    if(!ses) {
        res.json({
            "msg" : "Invalid Session ID"
        })
        return;
    }
    //let user = await User.findById(req.body.userid)
    let user = ses.users.id(req.body.userid)
    console.log(user)
    if(!user) {
        res.json({
            "msg" : "Invalid User ID"
        })
        return;
    }
    let authstatus = null
    try{
        authstatus = await HardAuthVerify(req.body.authblob,ses.id,user)
    }
    catch(e){
        console.log("ERROR IN HARD AUTH " , e)
    }
    console.log("AUTHSTATUS" , authstatus)
    console.log("PARAMS" + [req.body.authblob,ses.id,user].toString())
    if(!authstatus) {
        res.json({
            "msg" : "Authentication Failed"
        })
        return;
    }
    res.locals.ses = ses
    res.locals.user = user
    next()
}


router.post("/:sid/join" ,async (req,res) =>  {
    // {
    //     "pubkey" : "",
    //     "auth" : ""
    // }
    console.log(req.body)
    let ses = await Session.findById(req.params.sid)
    if(!ses) {
        res.json({
            "msg" : "Invalid Session ID"
        })
        return;
    }
    crypto.pbkdf2(req.body.auth, ses.auth.split(":")[1] , 99 , 16, 
        'sha512', (err, derivedKey) => { 
            if(err){
                throw err;
            }
            if(derivedKey.toString('hex') === ses.auth.split(":")[0]){
                let joiner = new User({pubkey: req.body.pubkey})
                ses.users.push(joiner)
                console.log(util.inspect(ses))
                ses.lastInteraction = Date.now()
                ses.save()
                res.json({
                    "userid" : joiner.id,
                    "sessionid" : ses.id,
                    "auth" : req.body.auth
                })
            }
            else{
                res.json({"msg" : "Authentication Failed"})
            }

        }
    )
    
})


// {
//     "userid" : "",
//     "authblob" : ""
// }

router.post("/:sid" ,HardCheck , async (req,res) => {
    console.log(req.body, "PASSED HARD AUTH")
    res.json({
        "sessionid" : res.locals.ses.id,
        "users" : res.locals.ses.users,
        "pending_requests" : res.locals.ses.pending_requests,
        "images" : res.locals.ses.images
    })
})

router.put("/:sid/createpr" , HardCheck , async (req, res) => {
    // {
    //     "to" : "",
    //     "request" : "",
    //     "userid" : "",
    //     "authblob" : ""
    // }
    let to = res.locals.ses.users.id(req.body.to)
    if(!to) {
        res.json({
            "msg" : "Invalid TO User ID"
        })
        return;
    }

    let newReq = new Request({to : to, from : res.locals.user, req : req.body.request, ts : Date.now()})
    res.locals.ses.pending_requests.push(newReq)
    res.locals.ses.lastInteraction = Date.now()
    res.locals.ses.save()
    res.json({
        "msg" : "Request Created Successfully",
        "request" : newReq
    })
})

router.delete("/:sid/delpr" , HardCheck , async (req, res) => {
    // {
    //     "userid" : "",
    //     "authblob" : "",
    //     "prid" : ""
    // }
    let pr = res.locals.ses.pending_requests.id(req.body.prid)
    if(!pr) {
        res.json({
            "msg" : "Invalid Request ID"
        })
        return;
    }
    if(res.locals.user.id !== pr.to.toString()){
        res.json({
            "msg" : "You are not authorized to delete this request"
        })
        return;
    }

    res.locals.ses.pending_requests.remove(pr)
    res.locals.ses.lastInteraction = Date.now()
    res.locals.ses.save()
    res.json({
        "msg" : "Request Deleted Successfully",
        "request" : pr
    })
})

router.put("/:sid/appendimg" , HardCheck , (req, res) => {
    // {
    //     "userid" : "",
    //     "authblob" : "",
    //     "hash" : "",
    //     "size" : 123,
    // }
    if(isNaN(req.body.size)) {
        res.json({
            "msg" : "Invalid Image Size"
        })
        return;
    }

    let newImg = new Image({hash : req.body.hash, size : req.body.size, ts : Date.now(), seed : [res.locals.user]})
    res.locals.ses.images.push(newImg)
    res.locals.ses.lastInteraction = Date.now()
    res.locals.ses.save()
    res.json({
        "msg" : "Image Appended Successfully",
        "image" : newImg
    })
})

router.patch("/:sid/mms" , HardCheck , (req, res) => {
    // {
    //     "userid" : "",
    //     "authblob" : "",
    //     "imageid" : ""
    // }
    let img = res.locals.ses.images.id(req.body.imageid)
    if(!img) {
        res.json({
            "msg" : "Invalid Image ID"
        })
        return;
    }
    img.seed = [res.locals.user , ...img.seed]
    res.locals.ses.lastInteraction = Date.now()
    res.locals.ses.save()
    res.json({
        "msg" : "MMS Done Successfully",
        "image" : img
    })
})



module.exports = {router}



