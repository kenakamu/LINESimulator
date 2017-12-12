#! node
// Run the simualtor from command prompt.
var shell = require("shelljs");
var os = require('os');

if(os.platform() === "win32"){
    shell.exec("start http://localhost:8080 && node app.js");
}
else if(os.platform() === "darwin"){
    shell.exec("open http://localhost:8080 && node app.js");
}
else if(os.platform() === "linux"){
    shell.exec("xdg-open http://localhost:8080 && node app.js");
}