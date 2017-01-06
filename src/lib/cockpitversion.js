const exec = require('child_process').execSync;
module.exports=exec('git rev-parse --short HEAD').toString().trim();