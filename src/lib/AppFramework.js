var logger = require('logger.js')({level: process.env.LOG_LEVEL || "error",name:"main"});

module.exports={
    logger : logger
}