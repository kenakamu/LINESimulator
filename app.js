// Dependencies.
var express = require('express');
var bodyParser = require("body-parser");
var fs = require('fs');
var request = require('request');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var crypto = require('crypto');
var botAPIAddress;
var channelSecret;
var channelToken;

// Specifie body parsers
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// Return all static files such as css and js in public folder.
app.use(express.static('public'))

/* Routing  */
// For root, return the emulator
app.get('/', function (req, res) {
    res.sendFile(__dirname + "/simulator.html");
});

// Set channelSettings.
app.post('/channelSettings', function (req, res) {
    botAPIAddress = req.body.botAPIAddress;
    channelSecret = req.body.channelSecret;
    channelToken = req.body.channelToken;
    request({
        headers: {"Authorization": "Bearer " + channelToken},
        uri: `${lineAPIUrl}bot/profile/${req.body.userId}`,
        method: "GET"
    },
        function (error, response, body) {
            if(body.indexOf("userId") == -1){
                res.status(response.statusCode).send(body);
            }
            else{
                return res.send(body);
            }
        }
    );    
});

// Receive file from client and send appropriate event to API.
app.post('/upload', function (req, res) {
    // Generate contentId by using time and copy the file into upload folder.
    var contentId = Date.now();
    if(!fs.existsSync(`${__dirname}\\public\\temp`)){
        fs.mkdirSync(`${__dirname}\\public\\temp`);
    }
    if (!fs.existsSync(`${__dirname}\\public\\temp\\${contentId}`)) {
        fs.mkdirSync(`${__dirname}\\public\\temp\\${contentId}`);
    }
    // Create message depending on file type (extension)
    var splitFileName = req.body.filename.split('\\');
    var filename = splitFileName[splitFileName.length - 1];
    var filePath = `\\temp\\${contentId}\\${filename}`;
    var fileFullPath = `${__dirname}\\public\\temp\\${contentId}\\${filename}`;
    if (req.body.base64string) {
        fs.writeFileSync(fileFullPath, new Buffer(req.body.base64string.split(',')[1], 'base64'));
    } else {
        fs.copyFileSync(req.body.filename,
            fileFullPath);
    }
    var fileext = filename.split('.')[1];
    var type = "file"
    if (fileext === "mp4") {
        type = "video";
    }
    else if (fileext === "png" || fileext === "jpeg" || fileext === "jpg") {
        type = "image";
    }
    else if (fileext === "m4a") {
        type = "audio"
    }
    var sendObject = {
        "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
        "type": "message",
        "timestamp": 1462629479859,
        "source": {
            "type": "user",
            "userId": req.body.userId
        },
        "message": {
            "id": contentId,
            "type": type
        }
    };

    var jsonData = JSON.stringify({ "events": [sendObject] });
    var signature = crypto.createHmac("SHA256", channelSecret)
        .update(jsonData)
        .digest().toString('base64');

    // Send request.
    request({
        headers: {
            "X-Line-Signature": signature
        },
        uri: botAPIAddress,
        body: jsonData,
        method: 'POST'
    },
        function (error, response, body) {
            // handle result if necessary.
        }
    );

    res.send({ "filePath": filePath, "sendObject": sendObject });
});

/* send request */
app.post('/send', function (req, res) {
    var jsonData = JSON.stringify(req.body);
    // Generate hash based on https://developers.line.me/en/docs/messaging-api/reference/#signature-validation
    var signature = crypto.createHmac("SHA256", channelSecret)
        .update(jsonData)
        .digest().toString('base64');

    request({
        headers: {
            "X-Line-Signature": signature
        },
        uri: botAPIAddress,
        body: jsonData,
        method: 'POST'
    },
        function (error, response, body) {
            // handle result if necessary.
        }
    );
});


//#region Behave as LINE Platform
const lineAPIUrl = "https://api.line.me/v2/";

// Issue channel access token
// https://developers.line.me/en/docs/messaging-api/reference/#issue-channel-access-token
app.post('/oauth/accessToken', function (req, res) {
    // Return 
    request({
        headers: req.headers,
        uri: `${lineAPIUrl}/oauth/accessToken`,
        method: 'POST',
        body: req.body
    },
        function (error, response, body) {
            res.send(body);
        }
    );
});

// Revoke channel access token
// https://developers.line.me/en/docs/messaging-api/reference/#revoke-channel-access-token
app.post('/oauth/revoke', function (req, res) {
    // Do nothing. just return 200.
    request({
        headers: req.headers,
        uri: `${lineAPIUrl}/oauth/revoke`,
        method: 'POST',
        body: req.body
    },
        function (error, response, body) {
            res.send(body);
        }
    );
});

// Send reply message
// https://developers.line.me/en/docs/messaging-api/reference/#send-reply-message
app.post('/bot/message/reply', function (req, res) {
    // Once received reply from API, simply pass it to client via socket and return success.
    io.emit('reply', req.body);
    res.sendStatus(200);
});

// Send push message
// https://developers.line.me/en/docs/messaging-api/reference/#send-push-message
app.post('/bot/message/push', function (req, res) {
    // Once received push from API, simply pass it to client by socket and return success.
    io.emit('reply', req.body);
    res.sendStatus(200);
});

// Send multicast messages
// https://developers.line.me/en/docs/messaging-api/reference/#send-multicast-messages
app.post('/bot/message/multicast', function (req, res) {
    // Once received multicast from API, simply pass it to client by socket and return success.
    io.emit('reply', req.body);
    res.sendStatus(200);
});

// Get content
// https://developers.line.me/en/docs/messaging-api/reference/#get-content
app.get('/bot/message/:messageId/content', function (req, res) {
    // The actual file sit in public\temp. Returns the file.
    var files = fs.readdirSync(`${__dirname}\\public\\temp\\${req.params.messageId}`);
    res.sendFile(`${__dirname}\\public\\temp\\${req.params.messageId}\\${files[0]}`);
});

// Redirect to LINE Platform if not handling in the app.
app.all('/bot/*', function (req, res) {
    // Redirect request to LINE Platform, then return the result.
    handleRequest(req, res);
});

// Handle all request by add LINE Platform Url.
function handleRequest(req, res) {
    // remove host header
    delete req.headers['host'];
    request({
        headers: req.headers,
        uri: `${lineAPIUrl}${req.url}`,
        method: req.method
    },
        function (error, response, body) {
            res.send(body);
        }
    );
}

//#endregion
/* Start the service */
http.listen(8080, function () {
    console.log('listening on *:8080');
});
