// Dependencies.
var express = require('express');
var path = require('path');
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
var pocMode;
var richMenuId;

// Specifie body parsers
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.raw({ limit: '50mb', type: '*/*' }));
// Return all static files such as css and js in public folder.
app.use(express.static(__dirname + '/public'))

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
        headers: { "Authorization": "Bearer " + channelToken },
        uri: `${lineAPIUrl}bot/profile/${req.body.userId}`,
        method: "GET"
    },
        function (error, response, body) {
            if (body.indexOf("userId") == -1) {
                res.status(response.statusCode).send(body);
            }
            else {
                return res.send(body);
            }
        }
    );
});

// Set pocMode.
app.post('/pocMode', function (req, res) {
    pocMode = req.body.pocMode;
    return res.sendStatus(200);
});

// Receive file from client and send appropriate event to API.
app.post('/upload', function (req, res) {
    // Generate contentId by using time and copy the file into upload folder.
    var contentId = Date.now().toString();
    if (!fs.existsSync(path.join(__dirname, 'public', 'temp'))) {
        fs.mkdirSync(path.resolve(__dirname, 'public', 'temp'));
    }
    if (!fs.existsSync(path.join(__dirname, 'public', 'temp', contentId))) {
        fs.mkdirSync(path.resolve(__dirname, 'public', 'temp', contentId));
    }
    // Create message depending on file type (extension)
    var splitFileName = req.body.filename.split('\\');
    var filename = splitFileName[splitFileName.length - 1];
    var filePath = path.join('temp', contentId, filename);
    var fileFullPath = path.join(__dirname, 'public', 'temp', contentId, filename);
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

    if (pocMode === "false") {
        var jsonData = JSON.stringify({ "events": [sendObject] });
        var signature = crypto.createHmac("SHA256", channelSecret)
            .update(jsonData)
            .digest().toString('base64');

        // Send request.
        request({
            headers: {
                "X-Line-Signature": signature,
                "Content-Type": "application/json"
            },
            uri: botAPIAddress,
            body: jsonData,
            method: 'POST'
        },
            function (error, response, body) {
                // handle result if necessary.
            }
        );
    }
    res.send({ "filePath": filePath, "sendObject": sendObject });
});

/* send request to your bot application */
app.post('/send', function (req, res) {
    var jsonData = JSON.stringify(req.body);
    // Generate hash based on https://developers.line.me/en/docs/messaging-api/reference/#signature-validation
    var signature = crypto.createHmac("SHA256", channelSecret)
        .update(jsonData)
        .digest().toString('base64');

    request(
        {
            headers: {
                "X-Line-Signature": signature,
                "Content-Type": "application/json"
            },
            uri: botAPIAddress,
            body: jsonData,
            method: 'POST'
        },
        function (error, response, body) {
            res.sendStatus(response.statusCode);
        }
    );
});

/* Get Rich menu for user */
app.get('/richmenu/:userId/:richMenuId', function (req, res) {
    // Generate hash based on https://developers.line.me/en/docs/messaging-api/reference/#signature-validation
    let url = `bot/user/${req.params.userId}/richmenu`;
    richMenuId = req.params.richMenuId;
    request({
        headers: { 'Authorization': `Bearer ${channelToken}` },
        uri: `${lineAPIUrl}${url}`,
        method: "GET"
    }, function (error, response, body) {
        if (JSON.parse(response.body).message === "the user has no richmenu") {
            res.send({ "message": "no menu" });
        }
        // If rich menuId is same as passed one, do nothing.
        else if (JSON.parse(response.body).richMenuId == richMenuId) {
            res.send(null);
        }
        // otherwise get the richmenu.
        else {
            richMenuId = JSON.parse(response.body).richMenuId;
            url = `bot/richmenu/${richMenuId}/content`;
            request({
                headers: { 'Authorization': `Bearer ${channelToken}` },
                encoding: null,
                uri: `${lineAPIUrl}${url}`,
                method: "GET"

            }, function (error, response, body) {
                var image = body;
                url = `bot/richmenu/${richMenuId}`;
                request({
                    headers: { 'Authorization': `Bearer ${channelToken}` },
                    uri: `${lineAPIUrl}${url}`,
                    method: "GET"
                }, function (error, response, body) {
                    res.send({ "richMenu": JSON.parse(body), "image": image });
                });
            });
        }
    });
});

//#region Behave as LINE Platform
const lineAPIUrl = "https://api.line.me/v2/";

// Receive request from your bot application.
app.all('/*', function (req, res) {
    var url = req.url;
    // reply, push and multicast will be simply pass to UI.
    if (url.indexOf('reply') > -1 || url.indexOf('push') > -1 || url.indexOf('multicast') > -1) {
        io.emit('reply', req.body);
        res.status(200).send({});
    }
    // if it request content
    else if (url.indexOf('content') > -1) {
        // The actual file sit in public\temp. Returns the file with messageId
        let messageId = url.slice(url.indexOf('message') + 8, url.indexOf('content') - 1);
        var files = fs.readdirSync(path.join(__dirname, 'public', 'temp', messageId));
        res.sendFile(path.join(__dirname, 'public', 'temp', messageId, files[0]));
    }
    else {
        handleRequest(req, res);
    }
});

// Handle all request by add LINE Platform Url.
function handleRequest(req, res) {
    // remove host header
    delete req.headers['host'];
    // Craft URL for LINE Platform.
    var url = req.url;
    if (url.indexOf('oauth') > -1) {
        url = url.slice(url.indexOf('oauth'), url.length);
    }
    else if (url.indexOf('bot') > -1) {
        url = url.slice(url.indexOf('bot'), url.length);
    }
    request({
        headers: req.headers,
        uri: `${lineAPIUrl}${url}`,
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
