const mongoose = require('mongoose')
const crypto = require("crypto");

const models = require('./models.js')
const Session = models.Session
const User = models.User
const Request = models.Request

const session_router = require("./session.js")
var CONFIG = require('../config.json');
var SECRETS = require('./secrets.json')

console.log("SESSION ROUTER" , session_router)
const CONNECTIONSTRING = SECRETS.mongo_connection_string + CONFIG.database

try {
    console.log("CONNECTION STRING" , CONNECTIONSTRING)
    mongoose.connect(CONNECTIONSTRING);
    console.log("Connected correctly to server");
} catch(e) {
  console.error(e);
}


express = require("express")
app = express()
app.use(express.json())
app.use(express.urlencoded());
app.use("/session" , session_router.router);

const util = require('util')
app.get("/ping" ,(req,res) => {
    res.send("pong")
} )

app.post("/create_session", (req,res) => {
    console.log(req.body)
    let salt = crypto.randomBytes(64).toString('hex');
    crypto.pbkdf2(req.body.auth, salt , 99 , 16, 
        'sha512', (err, derivedKey) => { 
        if (err) {
            throw err
        }
        let auth_hash = derivedKey.toString('hex') + ":" + salt
        let ses = new Session({"lastInteraction" : Date.now()  , "auth" : auth_hash})
        let creator = new User({pubkey: req.body.pubkey})
        ses.users.push(creator)
        console.log(util.inspect(ses))
        ses.save()
        res.json({
            "userid" : creator.id,
            "sessionid" : ses.id,
            "auth" : req.body.auth
        })
    
    }); 

})


app.get("/alive_sessions" , async (req, res) => {
    res.json((await Session.find()).map(a=> a.id))
})


app.listen(3000 , () => console.log("ALIVE"))


