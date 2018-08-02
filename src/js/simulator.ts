/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/nedb/index.d.ts" />
/// <reference path="../../node_modules/@types/socket.io/index.d.ts" />
/// <reference path="../../node_modules/@types/nedb/index.d.ts" />
/// <reference path="../models/lineSettings.ts" />
/// <reference path="../models/lineTypes.ts" />

var zoom: number = 1;
var screenHeigt: number = 0;
var userId: string = "";
var pocMode: boolean = false;
var messageId: string = "";

{
  const electron = require('electron');
  const app = electron.remote.app;
  const shell = electron.remote.shell;
  const io = require('socket.io-client');
  const nedb = require('nedb');
  const path = require('path');
  const ipc = electron.ipcRenderer;
  const db = new nedb({ filename: path.join(app.getPath('userData'), 'data'), autoload: true })
  const simulatorWrapElem = $('.simulator-wrap');
  const simulatorElem = $('.simulator');
  const botChatElem = $('.bot-chat');
  messageId = new Date().toString();

  // Load settings at startup
  function loadUesrId() {
    db.find({}, function (err, docs) {
      if (docs.length > 0) {
        let settings = docs[0];
        userId = settings.userId;
      }
    });
  }
  // Add chat item when events are received from Bot API.
  function receiveMessages(data) {
    for (let i = 0; i < data.messages.length; i++) {
      // Create list item from recevied message.
      var li = parseDataAndReturnListItem(data.messages[i]);
      // append the reply.
      appendBotReplyToThread(li);
    }
  }
  // Update time
  function updateTime() {
    var current = new Date();
    $('.time').each(function (index, value) { this.innerText = current.getHours() + ":" + current.getMinutes(); });
  }
  // Handle binding
  function bindHandlers() {
    $('#message-to-send').bind("keypress", {}, sendByEnter);
    $('.chat-raw').bind("keydown", {}, selectRaw);
    $(document).bind("keydown", {}, disableCtrlA);

    $('#loadJsonFile').on("change", () => { loadJson(); });
  }

  // connect to other process
  ipc.on('datetimepicker-result', (event, arg) => {
    sendDatetimePickerResult(arg);
  });
  ipc.on('pocMode', (event, arg) => {
    this.pocMode = arg;
    if (this.pocMode) {
      if (botChatElem.hasClass("hide")) {
        resetSize();
        botChatElem.removeClass("hide");
      }
    }
  });

  // Craete sockect for bi-directional real-time communication.
  let socket = io();
  socket.on('reply', function (data) {
    receiveMessages(data);
  });
  loadUesrId();
  resetSize();
  // Update time every minutes,
  setInterval(updateTime, 60000);
  // Setup key pressdown event.
  bindHandlers();

  // Reset to default size.
  function resetSize() {
    screenHeigt = screen.availHeight;
    zoom = (screenHeigt * 0.80) / (736 + 150);
    simulatorElem[0].style.transform = `scale(${zoom})`;
    simulatorWrapElem.width(simulatorElem.width() * zoom);
    simulatorWrapElem.height(simulatorElem.height() * zoom);
    let width = simulatorElem.width() * zoom + 150;
    let height = simulatorElem.height() * zoom + 50;
    if(pocMode){
      width = screen.availWidth;
      height = screenHeigt;
    }
    window.resizeTo(width, height);
  }
  // Open a link in external window
  function openExternal(url: string) {
    shell.openExternal(url);
  }
  // Handle Chat Item select event.
  function onSelectChatItem(obj) {
    if (pocMode) {
      $('.chat-item-tool').remove();
      $(obj).after(`<li tabindex="1" class="chat-item-tool active-li">
          <div>
            <i class="fas fa-trash fa-inverse fa-2x" onclick="removeChatItem(this);"></i>
            <i class="fas fa-arrow-up fa-inverse fa-2x" onclick="moveItem(this, true)"></i>
            <i class="fas fa-arrow-down fa-inverse fa-2x" onclick="moveItem(this, false)"></i>
            <i class="fas fa-times fa-inverse fa-2x right" onclick="{$('.chat-item-tool').remove();}"></i>
          </div> 
        </li>`);
      if (obj.hasClass('chat-user')) {
        $('.chat-item-tool').addClass('chat-user');
      }
      $('.chat-item-tool')[0].focus();
    }
    // Display RowData
    else {
      $('.chat-raw').children('pre')[0].innerText = JSON.stringify(
        JSON.parse($(obj).attr('data')), null, '\t');
    }
  }
  // Handle DateTime Picker
  function handleDateTimePicker(data: string, mode: string, initial: string, max: string, min: string) {
    let win;
    // Create the browser window.
    let port = 8080;
    let BrowserWindow = require('electron').remote.BrowserWindow;
    win = new BrowserWindow({
      alwaysOnTop: true,
      frame: false,
      width: 400,
      height: 250,
      transparent: true,
      show: false
    });

    // and load the index.html of the app.
    win.loadURL(`http://localhost:${port}/datetimepicker`);

    // Open the DevTools.
    win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on('closed', () => {
      // Dereference the window object, usually you would store windows
      // in an array if your app supports multi windows, this is the time
      // when you should delete the corresponding element.
      win = null
    });

    win.webContents.once('dom-ready', () => {
      win.webContents.send('datetimepicker-object', { data: data, mode: mode, initial: initial, max: max, min: min })
      win.show();
    });
  }
  // 
  function sendDatetimePickerResult(arg: any) {
    let param = new postbackParam();

    sendPostback(arg.data, arg.param);
  }

  //#region append chat item 

  // Append user input item to chat body
  function appendUserInputToThread(sendObject) {
    let chatThread = $(".chat-thread ul");
    let message = sendObject.message;
    if (message.type === "text") {
      chatThread.append(`<li tabindex="1" data='${JSON.stringify(sendObject)}' 
      class="chat-user chat-text" 
      onclick='onSelectChatItem($(this))'>
      ${message.text}</li>`);
    }
    else if (message.type === "location") {
      chatThread.append(`<li tabindex="1" data='${JSON.stringify(sendObject)}' 
      class="chat-user chat-location" 
      onclick='onSelectChatItem($(this))'>
        <div><i class="fa fa-flag"></i></div>
        <div>${message.title}<br/>${message.address}</div></li>`);
    }
    else if (message.type === "sticker") {
      chatThread.append(`<li tabindex="1" data='${JSON.stringify(sendObject)}' 
      class="chat-user chat-sticker" 
      onclick='onSelectChatItem($(this))'>
      stickerId:<br/>${message.stickerId}</li>`);
    }
    $('.chat-thread li').last().addClass('active-li').focus();
    $('#message-to-send')[0].focus();
  }
  // display user media input to thread.
  function appendMediaToThread(data) {
    let fileext = data.filePath.split('.')[1];
    if (fileext === "mp4") {
      appendVideoToThread(data.filePath, data.sendObject);
    }
    else if (fileext === "png" || fileext === "jpeg" || fileext === "jpg") {
      appendImageToThread(data.filePath, data.sendObject);
    }
    else if (fileext === "m4a") {
      appendAudioToThread(data.filePath, data.sendObject);
    }
    else {
      return;
    }
  }
  // Append image message as user.
  function appendImageToThread(path, sendObject) {
    let chatThread = $(".chat-thread ul");
    chatThread.append(`<li tabindex="1" data='${JSON.stringify(sendObject)}' class="chat-user chat-img" onclick='onSelectChatItem($(this))'>
      <img alt="Embedded Image" src="${path}"/>
      </li>`);
    $('.chat-thread li').last().addClass('active-li').focus();
    $('#message-to-send')[0].focus();
  }
  // Append video message as user.
  function appendVideoToThread(path, sendObject) {
    let chatThread = $(".chat-thread ul");
    chatThread.append(`<li tabindex="1" data='${JSON.stringify(sendObject)}' class="chat-user chat-img" onclick='onSelectChatItem($(this))'>
        <video controls autoplay>
          <source src="${path}" type="video/mp4">
        </video>
      </li>`);
    $('.chat-thread li').last().addClass('active-li').focus();
    $('#message-to-send')[0].focus();
  }
  // Play audio for chat-audio
  function play(element) {
    $(element)[0].play();
  }
  // Append Audio message as user.
  function appendAudioToThread(path, sendObject) {
    let chatThread = $(".chat-thread ul");
    let audioId = Date.now();
    chatThread.append(`<li tabindex="1" data='${JSON.stringify(sendObject)}' class="chat-user chat-audio" onclick='onSelectChatItem($(this))'>
        <i class="fa fa-play-circle fa-lg" onclick="play('#${audioId}');"></i> 11:11ã€€ã€€-----------
        <audio id="${audioId}" src="${path}"><audio>
      </li>`);
    $('.chat-thread li').last().addClass('active-li').focus();
    $('#message-to-send')[0].focus();
  }
  // Parse LINE message object into HTML list item.
  // tabindex attribute is neccesary to set focus on it for auto scroll to bottom.
  function parseDataAndReturnListItem(data) {
    let reply: string = "";
    if (data.type === messageType.text) {
      reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-text" onclick='onSelectChatItem($(this))'>${data.text}</li>`;
    }
    else if (data.type === messageType.sticker) {
      reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-sticker" onclick='onSelectChatItem($(this))'>stickerId:<br/>${data.stickerId}</li>`;
    }
    else if (data.type === messageType.image) {
      reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-img" onclick='onSelectChatItem($(this))'><img src="${data.previewImageUrl}"/></li>`;
    }
    else if (data.type === messageType.location) {
      reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-location" onclick='onSelectChatItem($(this))'>
              <div>
                  <i class="fa fa-flag"></i>
              </div>
              <div>
                ${data.title}
                <br/>
                ${data.address}
              </div>
          </li>`;
    }
    else if (data.type === messageType.video) {
      reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-img" onclick='onSelectChatItem($(this))'>
                <video controls autoplay>
                    <source src="${data.originalContentUrl}" type="video/mp4>
                  </video>
            </li>`
    }
    else if (data.type === messageType.audio) {
      let audioId = Date.now();
      let audioLength = data.duration;
      let minutes = Math.floor(audioLength / 60000);
      let seconds: number = ((audioLength % 60000) / 1000);
      reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-audio" onclick='onSelectChatItem($(this))'>
          <i class="fa fa-play-circle fa-lg" onclick="play('#${audioId}');"></i> ${minutes + ":" + (seconds < 10 ? '0' : '') + seconds}ã€€ã€€-----------
          <audio id="${audioId}">
              <source src="${data.originalContentUrl}">
          </audio>
      </li>`
    }
    else if (data.type === messageType.template) {
      if (data.template.type == "buttons") {
        reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-template chat-template-buttons" onclick='onSelectChatItem($(this))'>`;
        if (data.template.thumbnailImageUrl) {
          if (data.template.thumbnailImageUrl.indexOf('url') > -1) {
            reply += `<div class="chat-template-buttons-image" style='background-image:${data.template.thumbnailImageUrl}'></div>`;
          }
          else {
            reply += `<div class="chat-template-buttons-image" style="background-image:url(${data.template.thumbnailImageUrl})"></div>`;
          }
        }
        if (data.template.title) {
          reply += `<div class="chat-template-buttons-title">${data.template.title}</div>`;
        }
        reply += `<div class="chat-template-buttons-text">${data.template.text}</div>`;
        for (let i = 0; i < data.template.actions.length; i++) {
          let action = data.template.actions[i];
          if (action.type == "postback") {
            if (action.text) {
              reply += `<div class="chat-template-buttons-button" onclick="{sendPostback('${action.data}');sendTextMessage('${action.text}');}">${action.label}</div>`;
            }
            else {
              reply += `<div class="chat-template-buttons-button" onclick="{sendTextMessage('${action.data}');}">${action.label}</div>`;
            }
          }
          else if (action.type == "message") {
            reply += `<div class="chat-template-buttons-button" onclick="{sendTextMessage('${action.text}');}">${action.label}</div>`;
          }
          else if (action.type == "uri") {
            reply += `<div class="chat-template-buttons-button"><a onclick="{openExternal('${action.uri}');}">${action.label}</a></div>`;
          }
          else if (action.type == "datetimepicker") {
            reply += `<div class="chat-template-buttons-button"><a onclick="{handleDateTimePicker('${action.data}', '${action.mode}', '${action.initial}', '${action.max}', '${action.min}');}">${action.label}</a></div>`;
          }
        }
        reply += '</li>';
      }
      else if (data.template.type == "confirm") {
        reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-template chat-template-confirm" onclick='onSelectChatItem($(this))'>
        <div class="chat-template-confirm-text">${data.template.text}</div>
        <div class="chat-template-confirm-yes" onclick="{sendTextMessage('${data.template.actions[0].text}');}">${data.template.actions[0].label}</div>
        <div class="chat-template-confirm-no" onclick="{sendTextMessage('${data.template.actions[1].text}');}">${data.template.actions[1].label}</div>
        </li>`;
      }
      else if (data.template.type == "carousel") {
        reply = `<li class="chat-bot chat-icon-only"></li>
          <li tabindex="1" data='${JSON.stringify(data)}' class="chat-template-carousel" onclick='onSelectChatItem($(this))'>`;
        for (let i = 0; i < data.template.columns.length; i++) {
          let column = data.template.columns[i];

          reply += `<div class="chat-template-buttons">`;
          if (column.thumbnailImageUrl) {
            if (column.thumbnailImageUrl.indexOf('url') > -1) {
              reply += `<div class="chat-template-buttons-image" style='background-image:${column.thumbnailImageUrl}'></div>`;
            }
            else {
              reply += `<div class="chat-template-buttons-image" style="background-image:url(${column.thumbnailImageUrl})"></div>`;
            }
          }
          if (column.title) {
            reply += `<div class="chat-template-buttons-title">${column.title}</div>`;
          }
          reply += `<div class="chat-template-buttons-text">${column.text}</div>`;
          for (let j = 0; j < column.actions.length; j++) {
            let action = column.actions[j];
            if (action.type == "postback") {
              if (action.text) {
                reply += `<div class="chat-template-buttons-button" onclick="{sendPostback('${action.data}');sendTextMessage('${action.text}');}">${action.label}</div>`;
              }
              else {
                reply += `<div class="chat-template-buttons-button" onclick="{sendTextMessage('${action.data}');}">${action.label}</div>`;
              }
            }
            else if (action.type == "message") {
              reply += `<div class="chat-template-buttons-button" onclick="{sendTextMessage('${action.text}');}">${action.text}</div>`;
            }
            else if (action.type == "uri") {
              reply += `<div class="chat-template-buttons-button"><a onclick="{openExternal('${action.uri}');}">${action.label}</a></div>`;
            }
          }
          reply += `</div>`;
        }

        reply += `</li>`;
      }
      else if (data.template.type == "image_carousel") {
        reply = `<li class="chat-bot chat-icon-only"></li>
          <li tabindex="1" data='${JSON.stringify(data)}' class="chat-template-carousel" onclick='onSelectChatItem($(this))'>`;
        for (let i = 0; i < data.template.columns.length; i++) {
          let column = data.template.columns[i];

          reply += `<div class="chat-template-image-carousel">`;
          if (column.imageUrl) {
            if (column.imageUrl.indexOf('url') > -1) {
              reply += `<div class="chat-template-image-carousel-image" style='background-image:${column.imageUrl}'></div>`;
            }
            else {
              reply += `<div class="chat-template-image-carousel-image" style="background-image:url(${column.imageUrl})"></div>`;
            }
          }
          reply += '<div class="chat-template-image-carousel-button">';
          let action = column.action;
          if (action.type == "postback") {
            if (action.text) {
              reply += `<div class="chat-template-image-carousel-button-content" onclick="{sendPostback('${action.data}');sendTextMessage('${action.text}');}">${action.label}</div>`;
            }
            else {
              reply += `<div class="chat-template-image-carousel-button-content" onclick="{sendTextMessage('${action.data}');}">${action.label}</div>`;
            }
          }
          else if (action.type == "message") {
            reply += `<div class="chat-template-image-carousel-button-content" onclick="{sendTextMessage('${action.text}');}">${action.text}</div>`;
          }
          else if (action.type == "uri") {
            reply += `<div class="chat-template-image-carousel-button-content"><a onclick="{openExternal('${action.uri}');}">${action.label}</a></div>`;
          }
          else if (action.type == "datetimepicker") {
            reply += `<div class="chat-template-image-carousel-button-content"><a onclick="{handleDateTimePicker('${action.data}', '${action.mode}', '${action.initial}', '${action.max}', '${action.min}');}">${action.label}</a></div>`;
          }
          reply += `</div></div>`;
        }
        reply += `</li>`;
      }
    }
    else if (data.type === messageType.imagemap) {
      let imagemapId = Date.now();
      reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-imagemap" onclick='onSelectChatItem($(this))'>
        <img src="${data.baseUrl}/1040.png" alt="${data.altText}" usemap="#${imagemapId}"/><map name="${imagemapId}">`;
      for (let i = 0; i < data.actions.length; i++) {
        let action = data.actions[i];
        if (action.type === "uri") {
          reply += `<area shape="rect" coords="${action.area.x},${action.area.y},${action.area.width + action.area.x},${action.area.height}" href="${action.linkUri}" target="_blank">`;
        }
        else if (action.type === "message") {
          reply += `<area shape="rect" coords="${action.area.x},${action.area.y},${action.area.width + action.area.x},${action.area.height}" href="javascript:sendTextMessage('${action.text}');">`;
        }
      }
      reply += `</map></li>`;
    }
    return reply;
  }

  //#endregion

  //#region Send data to local API

  // upload file.  !!!Need file types.
  function uploadFile() {
    let filename = $("#filename").val();
    // Read file data
    let reader = new FileReader();
    // Callback when file read.
    reader.onload = function (event) {
      $("#filename").val("");
      let result = event.target.result;
      let sendObject = { "filename": filename, "userId": userId, "base64string": result };

      $.ajax({
        url: "/upload",
        type: "POST",
        data: sendObject,
        success: function (data) {
          appendMediaToThread(data);
        }
      });
    };
    reader.readAsDataURL((<HTMLInputElement>$("#filename")[0]).files[0]);
  }

  // Handle key down event for textarea.
  function sendByEnter(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode                        
      sendFromChatBox();
    }
  }
  // Send text from text area.
  function sendFromChatBox() {
    var text = $('#message-to-send').val().toString();
    // Reset input
    $('#message-to-send').val("");
    sendTextMessage(text);
  }
  // send data to Bot API.
  function send(sendObject) {
    // if POC mode, then do not send to bot.
    if (pocMode) {
      return;
    }
    $.ajax({
      url: "/send",
      contentType: "application/json",
      type: "POST",
      data: JSON.stringify({ "events": [sendObject] }),
      success: function () {
      },
      error: function (xhr, ajaxOptions, thrownError) {
      }
    });
  }
  // Send text message.
  function sendTextMessage(text: string) {
    // Craft LINE message
    let sendObject = new textMessage(
      "dummyToken",
      1462629479859,
      userId,
      messageId,
      text);

    appendUserInputToThread(sendObject);
    send(sendObject);
  }
  // Send sticker event.
  function sendSticker() {
    // Craft LINE message
    let sendObject = new stickerMessage(
      "dummyToken",
      1462629479859,
      userId,
      messageId,
      $('#packageId').val().toString(),
      $('#stickerId').val().toString()
    );
    appendUserInputToThread(sendObject);
    send(sendObject);
  }
  // Send Location event.
  function sendAddress() {
    // Craft LINE message
    let sendObject = new locationMessage(
      "dummyToken",
      1462629479859,
      userId,
      messageId,
      $('#title').val().toString(),
      $('#address').val().toString(),
      $('#latitude').val() as number,
      $('#longitude').val() as number
    );

    appendUserInputToThread(sendObject);
    send(sendObject);
  }
  // Send postback event.
  function sendPostback(data: string, params?: postbackParam) {
    // Craft LINE message
    let sendObject = new postbackMessage(
      "dummyToken",
      1462629479859,
      userId,
      data
    );

    if (params) {
      sendObject.postback.params = params;
    }

    send(sendObject);
  }
  /* System messages */
  function sendFollow() {
    // Craft LINE message
    let sendObject = new followMessage(
      "dummyToken",
      1462629479859,
      userId
    );

    send(sendObject);
  }
  function sendUnfollow() {
    // Craft LINE message
    let sendObject = new unfollowMessage(
      "dummyToken",
      1462629479859,
      userId
    );

    send(sendObject);
  }
  function sendJoin() {
    // Craft LINE message
    let sendObject = new joinMessage(
      "dummyToken",
      1462629479859,
      "C4af4980629..."
    );

    send(sendObject);
  }
  function sendLeave() {
    // Craft LINE message
    let sendObject = new leaveMessage(
      "dummyToken",
      1462629479859,
      "C4af4980629..."
    );

    send(sendObject);
  }
  function sendBeacon() {
    // Craft LINE message
    let sendObject = new beaconMessage(
      "dummyToken",
      1462629479859,
      userId,
      $('#beacon_hwid').val().toString(),
      $('#beacon_type').val() as beaconType
    );

    send(sendObject);
  }

  //#endregion

}


