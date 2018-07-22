/// <reference path="../node_modules/@types/body-parser/index.d.ts" />
/// <reference path="../node_modules/@types/express/index.d.ts" />
/// <reference path="./models/lineSettings.ts"/>
/// <reference path="./models/lineTypes.ts"/>

// require('source-map-support').install({
//   environment: 'node'
// });

{
  const { app, Menu, BrowserWindow, ipcMain } = require('electron');
  const path = require('path');
  const shell = require('electron').shell;

  // Dependencies.
  const expressapp = require('express')
  const bodyParser = require("body-parser");
  const express = expressapp();
  const fs = require('fs');
  const request = require('request');
  const http = require('http').Server(express);
  const io = require('socket.io')(http);
  const port: number = 8080;
  const nedb = require('nedb');
  const db = new nedb({ filename: path.join(app.getPath('userData'), 'data'), autoload: true })
  let settings: lineSettings;
  var pocMode: boolean = false;
  // Load the settings first.
  db.find({}, function (err, docs) {
    if (docs.length > 0) {
      settings = docs[0];
    }
  });

  (function(){
    if (require('electron-squirrel-startup')) return;
  })();
  // Express part
  express.use(bodyParser.json({ limit: '50mb' }));
  express.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
  express.use(bodyParser.raw({ limit: '50mb', type: '*/*' }));
  // Return all static files such as css and js in dist folder.
  express.use(expressapp.static(__dirname))

  /* Routing  */
  // For root, return the index
  express.get('/', function (req, res) {
    res.sendFile(__dirname + "/html/index.html");
  });
  express.get('/simulator', function (req, res) {
    res.sendFile(__dirname + "/html/simulator.html");
  });

  express.get('/datetimepicker', function (req, res) {
    res.sendFile(__dirname + "/html/datetimePicker.html");
  });

  // Set channelSettings.
  express.post('/channelSettings', function (req, res) {
    settings = {
      userId: req.body.userId,
      channelSecret: req.body.channelSecret,
      channelToken: req.body.channelToken,
      botAPIAddress: req.body.botAPIAddress
    };
    db.remove({}, { multi: true }, (err, numRemoved) => {
      db.insert(settings, (err, newDoc) => {
        request({
          headers: { "Authorization": "Bearer " + req.body.channelToken },
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
    });
  });

  // Set pocMode.
  express.post('/pocMode', function (req, res) {
    pocMode = req.body.pocMode as boolean;
    return res.sendStatus(200);
  });

  // Receive file from client and send expressropriate event to API.
  express.post('/upload', function (req, res) {
    // Generate contentId by using time and copy the file into upload folder.
    var contentId = Date.now().toString();
    if (!fs.existsSync(path.join(__dirname, 'temp'))) {
      fs.mkdirSync(path.resolve(__dirname, 'temp'));
    }
    if (!fs.existsSync(path.join(__dirname, 'temp', contentId))) {
      fs.mkdirSync(path.resolve(__dirname, 'temp', contentId));
    }
    // Create message depending on file type (extension)
    var splitFileName = req.body.filename.split('\\');
    var filename = splitFileName[splitFileName.length - 1];
    var filePath = path.join('temp', contentId, filename);
    var fileFullPath = path.join(__dirname, 'temp', contentId, filename);
    if (req.body.base64string) {
      fs.writeFileSync(fileFullPath, new Buffer(req.body.base64string.split(',')[1], 'base64'));
    } else {
      fs.copyFileSync(req.body.filename,
        fileFullPath);
    }
    var fileext = filename.split('.')[1];
    let sendObject;
    if (fileext === "mp4") {
      sendObject = new audioMessage(
        "dummyToken",
        1462629479859,
        settings.userId,
        contentId
      );
    }
    else if (fileext === "png" || fileext === "jpeg" || fileext === "jpg") {
      sendObject = new imageMessage(
        "dummyToken",
        1462629479859,
        settings.userId,
        contentId
      );
    }
    else if (fileext === "m4a") {
      sendObject = new videoMessage(
        "dummyToken",
        1462629479859,
        settings.userId,
        contentId
      );
    }

    if (pocMode === false) {
      const crypto = require('crypto');
      var jsonData = JSON.stringify({ "events": [sendObject] });
      var signature = crypto.createHmac("SHA256", settings.channelSecret)
        .update(jsonData)
        .digest().toString('base64');

      // Send request.
      request({
        headers: {
          "X-Line-Signature": signature,
          "Content-Type": "application/json"
        },
        uri: settings.botAPIAddress,
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

  /* send request to your bot expresslication */
  express.post('/send', function (req, res) {
    const crypto = require('crypto');
    var jsonData = JSON.stringify(req.body);
    // Generate hash based on https://developers.line.me/en/docs/messaging-api/reference/#signature-validation
    var signature = crypto.createHmac("SHA256", settings.channelSecret)
      .update(jsonData)
      .digest().toString('base64');

    request(
      {
        headers: {
          "X-Line-Signature": signature,
          "Content-Type": "application/json"
        },
        uri: settings.botAPIAddress,
        body: jsonData,
        method: 'POST'
      },
      function (error, response, body) {
        res.sendStatus(response.statusCode);
      }
    );
  });

  /* Get Rich menu for user */
  express.get('/richmenu/:userId/:richMenuId', function (req, res) {
    // Generate hash based on https://developers.line.me/en/docs/messaging-api/reference/#signature-validation
    let url = `bot/user/${req.params.userId}/richmenu`;
    let richMenuId = req.params.richMenuId;
    request({
      headers: { 'Authorization': `Bearer ${settings.channelToken}` },
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
          headers: { 'Authorization': `Bearer ${settings.channelToken}` },
          encoding: null,
          uri: `${lineAPIUrl}${url}`,
          method: "GET"

        }, function (error, response, body) {
          var image = body;
          url = `bot/richmenu/${richMenuId}`;
          request({
            headers: { 'Authorization': `Bearer ${settings.channelToken}` },
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

  // Receive request from your bot expresslication.
  express.all('/*', function (req, res) {
    var url = req.url;
    // reply, push and multicast will be simply pass to UI.
    if (url.indexOf('reply') > -1 || url.indexOf('push') > -1 || url.indexOf('multicast') > -1) {
      io.emit('reply', req.body);
      res.sendStatus(200);
    }
    // if it request content
    else if (url.indexOf('content') > -1) {
      // The actual file sit in dist\temp. Returns the file with messageId
      let messageId = url.slice(url.indexOf('message') + 8, url.indexOf('content') - 1);
      var files = fs.readdirSync(path.join(__dirname, 'temp', messageId));
      res.sendFile(path.join(__dirname, 'temp', messageId, files[0]));
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
  http.listen(port, function () {
    console.log(`listening on *:${port}`);
  });

  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  let win

  function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({ width: 800, height: 500 });

    // and load the index.html of the app.
    win.loadURL(`http://localhost:${port}`);

    // Open the DevTools.
    //win.webContents.openDevTools()

    // Emitted when the window is closed.
    win.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win = null
    });

    var menu = Menu.buildFromTemplate([
      {
        label: 'Menu',
        submenu: [
          { type: 'separator' },
          {
            label: 'Exit', click() {
              app.quit();
            }
          }
        ]
      },
      {
        label: 'LINE Info',
        submenu: [
          {
            label: 'LINE Developer Console', click() {
              shell.openExternal('https://developers.line.me/console/');
            }
          },
          {
            label: 'Messaging API Reference', click() {
              shell.openExternal('https://developers.line.me/ja/reference/messaging-api/');
            }
          }
        ]
      }
    ]);

    Menu.setApplicationMenu(menu);
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  })

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  })

  // ipc to index page for datetimepicker value
  ipcMain.on('datetimepicker-result', (event, arg) => {
    win.webContents.send('datetimepicker-result', arg);
  });

  ipcMain.on('simulator-status', (event, arg) => {
    if (arg as boolean) {
      win.hide();
    } else {
      win.show();
    }
  });
  // In this file you can include the rest of your app's specific main process
  // code. You can also put them in separate files and require them here.
}