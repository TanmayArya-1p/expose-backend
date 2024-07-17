const mongoose = require('mongoose')

const models = require('./models.js')
const Session = models.Session
const User = models.User
const Request = models.Request
var CONFIG = require('../config.json');
var SECRETS = require('./secrets.json')

const CONNECTIONSTRING = SECRETS.mongo_connection_string + CONFIG.database
const TIMEOUT = CONFIG.sweeper.session_timeout_ms //in ms
const TIMEZONE_OFFSET = CONFIG.sweeper.timezone_offset_hours // in hours
const SWEEP_INTERVAL = CONFIG.sweeper.sweep_interval_ms //in ms

try {
    mongoose.connect(CONNECTIONSTRING);
    console.log("Sweeper Connected to MongoDB Server");
} catch(e) {
  console.error(e);
}

sweep()
setInterval(sweep , SWEEP_INTERVAL)


function formatDateTime(msSinceEpoch) {
    const date = new Date(msSinceEpoch);
    date.setHours(date.getHours() + TIMEZONE_OFFSET);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
  
    const formattedDate = `${year}-${month}-${day}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    return `${formattedDate}  ${formattedTime}`;
  }
async function sweep() {
    console.log("\nSweep Initiated at " + formatDateTime(Date.now()) )
    const sessions = await Session.find()
    sessions.forEach(async session => {
        if (Date.now() - session.lastInteraction >= TIMEOUT) {
            Session.findByIdAndDelete(session.id)
            console.log(`Deleted Dormant Session: ${session.id}`)
        }
    })
    console.log("Sweep Completed at "+ formatDateTime(Date.now()) )
    console.log("Next Sweep At "+ formatDateTime(Date.now()+SWEEP_INTERVAL) + "\n" )
}