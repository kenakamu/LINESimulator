(function () {

  /* real-time chat windows update handler*/
  // Add chat item when events are received from Bot API.
  function receiveMessages(data) {
    for (i = 0; i < data.messages.length; i++) {
      // Create list item from recevied message.
      var li = parseDataAndReturnListItem(data.messages[i]);
      // append the reply.
      appendBotReplyToThread(li);
    }
  }

  // Handle key down event for textarea.
  function sendByEnter(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode                        
      sendFromChatBox();
    }
  }

  // Copy JSON text only.
  function selectRaw(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (e.ctrlKey && code == 65) { //CTRL+A 
      let selection = window.getSelection();
      let range = document.createRange();
      range.selectNodeContents($('#rawdata')[0]);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  // Disable Ctrl+A so that it only works in JSON raw.
  function disableCtrlA(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (e.ctrlKey && code == 65) { //CTRL+A 
      return false;
    }
  }
  // Update time
  function updateTime() {
    var current = new Date();
    $('.time').each(function (index, value) { this.innerText = current.getHours() + ":" + current.getMinutes(); });
  }

  function loadSettings() {
    userId = localStorage.getItem('userId');
    let channelSecret = localStorage.getItem('channelSecret');
    let channelToken = localStorage.getItem('channelToken');
    let botAPIAddress = localStorage.getItem('botAPIAddress');
    $("#userId")[0].value = userId;
    $("#channelSecret")[0].value = channelSecret;
    $("#channelToken")[0].value = channelToken;
    $("#botAPIAddress")[0].value = botAPIAddress;
    if (!userId || !channelToken || !channelToken || !botAPIAddress) {
      // Do nothing. Let settings pane open.
    }
    else {      
      setSettings();
    }
  }
  // Craete sockect for bi-directional real-time communication.
  var socket = io();
  socket.on('reply', function (data) {
    receiveMessages(data);
  });

  setInterval(updateTime, 60000);
  updateTime();
  loadSettings();
  // Setup key pressdown event.
  $('#message-to-send').bind("keypress", {}, sendByEnter);
  $('.chat-raw').bind("keydown", {}, selectRaw);
  // Disable select in body so that only chat-raw pre is selectable.
  // $(document).attr('unselectable', 'on')
  //   .css('user-select', 'none')
  //   .on('selectstart', false);
  $(document).bind("keydown", {}, disableCtrlA);
}());

//#region settings
var userId = "";
function setSettings() {
  let userIdInput = $("#userId")[0];
  let channelSecretInput = $('#channelSecret')[0];
  let channelTokenInput = $('#channelToken')[0];
  let botAPIAddressInput = $('#botAPIAddress')[0];
  if (!userIdInput.value || !channelSecretInput.value || !channelTokenInput.value || !botAPIAddressInput.value) {
    $('.warning')[0].innerText = "Please set values";
  }
  else {
    userId = userIdInput.value;
    channelSecret = channelSecretInput.value;
    channelToken = channelTokenInput.value;
    botAPIAddress = botAPIAddressInput.value;
    localStorage.setItem("userId", userId);
    localStorage.setItem("channelSecret", channelSecret);
    localStorage.setItem("channelToken", channelToken);
    localStorage.setItem("botAPIAddress", botAPIAddress);
    $.ajax({
      url: "/channelSettings",
      type: "POST",
      data: {
        "botAPIAddress": botAPIAddress,
        "channelSecret": channelSecret,
        "channelToken": channelToken,
        "userId": userId
      },
      success: function (data) {
        $('.warning')[0].innerText = "";
        toggleSettings();
      },
      error: function (xhr, ajaxOptions, thrownError) {        
        $('.warning')[0].innerText = `Error : ${JSON.parse(xhr.responseText).message}`;
      }
    });
  }
}


//#endregion

// upload file.  !!!Need audio and file types.
function uploadFile() {
  var filename = $("#filename")[0].value;
  // if it contains fakepath, then get actual data and send it to server.
  if (filename.indexOf('fakepath') !== -1) {

    var reader = new FileReader();
    reader.onload = function (event) {
      let result = event.target.result;
      var sendObject = { "filename": filename, "userId": userId, "base64string": result };
      $.ajax({
        url: "/upload",
        type: "POST",
        data: sendObject,
        success: function (data) {
          appendMediaToThread(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
        }
      });
    };
    reader.readAsDataURL($("#filename")[0].files[0]);
  }
  else {
    $("#filename")[0].value = "";
    var sendObject = { "filename": filename, "userId": userId };
    // Upload image to emulator server.
    $.ajax({
      url: "/upload",
      type: "POST",
      data: sendObject,
      success: function (data) {
        appendMediaToThread(data);
      },
      error: function (xhr, ajaxOptions, thrownError) {
      }
    });
  }
}

// display user media input to thread.
function appendMediaToThread(data) {
  var fileext = data.filePath.split('.')[1];
  if (fileext === "mp4") {
    appendVideoToThread(data.filePath, data.sendObject);
  }
  else if (fileext === "png" || fileext === "jpeg" || fileext === "jpg") {
    appendImageToThread(data.filePath, data.sendObject);
  }
  else {
    return;
  }
}

// Send sticker event.
function sendSticker() {
  // Craft LINE message
  var sendObject = {
    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
    "type": "message",
    "timestamp": 1462629479859,
    "source": {
      "type": "user",
      "userId": userId
    },
    "message": {
      "id": "325708",
      "type": "sticker",
      "packageId": $('#packageId')[0].value,
      "stickerId": $('#stickerId')[0].value
    }
  };
  appendStickerMessageToThread($('#stickerId')[0].value, sendObject);
  send(sendObject);
}

// Send Location event.
function sendAddress() {
  // Craft LINE message
  var sendObject = {
    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
    "type": "message",
    "timestamp": 1462629479859,
    "source": {
      "type": "user",
      "userId": userId
    },
    "message": {
      "id": "325708",
      "type": "location",
      "title": $('#title')[0].value,
      "address": $('#address')[0].value,
      "latitude": $('#latitude')[0].value,
      "longitude": $('#longitude')[0].value
    }
  };

  send(sendObject);
}

// Parse LINE message object into HTML list item.
// tabindex attribute is neccesary to set focus on it for auto scroll to bottom.
function parseDataAndReturnListItem(data) {
  if (data.type == "text") {
    var reply = `<li tabindex="1" class="chat-bot chat-text" onclick='displayRaw(${JSON.stringify(data)})'>${data.text}<span>${JSON.stringify(data)}</span></li>`;
  }
  else if (data.type == "sticker") {
    var reply = `<li tabindex="1" class="chat-bot chat-sticker" onclick='displayRaw(${JSON.stringify(data)})'>stickerId:<br/>${data.stickerId}</li>`;
  }
  else if (data.type == "image") {
    var reply = `<li tabindex="1" class="chat-bot chat-img" onclick='displayRaw(${JSON.stringify(data)})'><img src="${data.previewImageUrl}"/></li>`;
  }
  else if (data.type == "video") {
    var reply = `<li tabindex="1" class="chat-bot chat-img" onclick='displayRaw(${JSON.stringify(data)})'>
              <video controls autoplay>
                  <source src="${data.originalContentUrl}" type="video/mp4>
                </video>
          </li>`
  }
  else if (data.type == "template") {
    if (data.template.type == "buttons") {
      var reply = `<li tabindex="1" class="chat-bot chat-template chat-template-buttons" onclick='displayRaw(${JSON.stringify(data)})'>`;
      if (data.template.thumbnailImageUrl) {
        reply += `<div class="chat-template-buttons-image" style="background-image:url(${data.template.thumbnailImageUrl})"></div>`;
      }
      if (data.template.title) {
        reply += `<div class="chat-template-buttons-title">${data.template.title}</div>`;
      }
      reply += `<div class="chat-template-buttons-text">${data.template.text}</div>`;
      for (let i = 0; i < data.template.actions.length; i++) {
        let action = data.template.actions[i];
        if (action.type == "postback") {
          if (action.text) {
            reply += `<div class="chat-template-buttons-button" onclick="{sendPostback('${action.data}');sendMessage('${action.text}');}">${action.label}</div>`;
          }
          else {
            reply += `<div class="chat-template-buttons-button" onclick="{sendMessage('${action.data}');}">${action.label}</div>`;
          }
        }
        else if (action.type == "message") {
          reply += `<div class="chat-template-buttons-button" onclick="{sendMessage('${action.text}');}">${action.text}</div>`;
        }
        else if (action.type == "uri") {
          reply += `<div class="chat-template-buttons-button"><a href="${action.uri}">${action.label}</a></div>`;
        }
      }
      reply += '</li>';
    }
    else if (data.template.type == "confirm") {
      var reply = `<li tabindex="1" class="chat-bot chat-template chat-template-confirm" onclick='displayRaw(${JSON.stringify(data)})'>
      <div class="chat-template-confirm-text">${data.template.text}</div>
      <div class="chat-template-confirm-yes" onclick="{sendMessage('${data.template.actions[0].text}');}">${data.template.actions[0].label}</div>
      <div class="chat-template-confirm-no" onclick="{sendMessage('${data.template.actions[1].text}');}">${data.template.actions[1].label}</div>
      </li>`;
    }
    else if (data.template.type == "carousel") {
      var reply = `<li class="chat-bot chat-icon-only"></li>
        <li tabindex="1" class="chat-template-carousel" onclick='displayRaw(${JSON.stringify(data)})'>`;
      for (let i = 0; i < data.template.columns.length; i++) {
        let column = data.template.columns[i];

        reply += `<div class="chat-template-buttons">`;
        if (column.thumbnailImageUrl) {
          reply += `<div class="chat-template-buttons-image" style="background-image:url(${column.thumbnailImageUrl})"></div>`;
        }
        if (column.title) {
          reply += `<div class="chat-template-buttons-title">${column.title}</div>`;
        }
        reply += `<div class="chat-template-buttons-text">${column.text}</div>`;
        for (let j = 0; j < column.actions.length; j++) {
          let action = column.actions[j];
          if (action.type == "postback") {
            if (action.text) {
              reply += `<div class="chat-template-buttons-button" onclick="{sendPostback('${action.data}');sendMessage('${action.text}');}">${action.label}</div>`;
            }
            else {
              reply += `<div class="chat-template-buttons-button" onclick="{sendMessage('${action.data}');}">${action.label}</div>`;
            }
          }
          else if (action.type == "message") {
            reply += `<div class="chat-template-buttons-button" onclick="{sendMessage('${action.text}');}">${action.text}</div>`;
          }
          else if (action.type == "uri") {
            reply += `<div class="chat-template-buttons-button"><a href="${action.uri}">${action.label}</a></div>`;
          }
        }
        reply += `</div>`;
      }

      reply += `</li>`;
    }
  }
  return reply;
}

function displayRaw(obj) {
  $('.chat-raw').children('pre')[0].innerText = JSON.stringify(obj, null, '\t');
  if($('.chat-raw')[0].hasClass("hide")){
    $('.chat-raw')[0].removeClass("hide");
  }
}

/* Append item to chat body */
// Append simply text message as user.
function appendTextMessageToThread(text, sendObject) {
  let chatThread = $(".chat-thread ul");
  chatThread.append(`<li tabindex="1" class="chat-user chat-text" onclick='displayRaw(${JSON.stringify(sendObject)});'>${text}</li>`);
  $('li').last().addClass('active-li').focus();
  $('#message-to-send')[0].focus();
}
// Append sticker message as user.
function appendStickerMessageToThread(stickerId, sendObject) {
  let chatThread = $(".chat-thread ul");
  chatThread.append(`<li tabindex="1" class="chat-user chat-sticker" onclick='displayRaw(${JSON.stringify(sendObject)});'>stickerId:<br/>${stickerId}</li>`);
  $('li').last().addClass('active-li').focus();
  $('#message-to-send')[0].focus();
}
// Append image message as user.
function appendImageToThread(path, sendObject) {
  let chatThread = $(".chat-thread ul");
  chatThread.append(`<li tabindex="1" class="chat-user chat-img" onclick='displayRaw(${JSON.stringify(sendObject)});'>
    <img alt="Embedded Image" src="${path}"/>
    </li>`);
  $('li').last().addClass('active-li').focus();
  $('#message-to-send')[0].focus();
}
// Append video message as user.
function appendVideoToThread(path, sendObject) {
  let chatThread = $(".chat-thread ul");
  chatThread.append(`<li tabindex="1" class="chat-user chat-img" onclick='displayRaw(${JSON.stringify(sendObject)});'>
      <video controls autoplay>
        <source src="${path}" type="video/mp4">
      </video>
    </li>`);
  $('li').last().addClass('active-li').focus();
  $('#message-to-send')[0].focus();
}
// Append bot reply to list and set focus on last item to auto scroll.
function appendBotReplyToThread(data) {
  let chatThread = $(".chat-thread ul");
  chatThread.append(data);
  $('li').last().addClass('active-li').focus();
  $('#message-to-send')[0].focus();
}

/* Send data to API */
// Send text from text area.
function sendFromChatBox() {
  var inputMessage = $('#message-to-send')[0].value;
  // Reset input
  $('#message-to-send')[0].value = "";
  sendMessage(inputMessage);
}
// send data to Bot API.
function send(sendObject) {
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
function sendMessage(message) {
  // Craft LINE message
  var sendObject = {
    "replyToken": "dummyToken",
    "type": "message",
    "timestamp": 1462629479859,
    "source": {
      "type": "user",
      "userId": userId
    },
    "message": {
      "id": "325708",
      "type": "text",
      "text": message
    }
  };

  appendTextMessageToThread(message, sendObject);
  send(sendObject);
}
// Send postback event.
function sendPostback(postback, params) {
  // Craft LINE message
  var sendObject = {
    "replyToken": "dummyToken",
    "type": "postback",
    "timestamp": 1462629479859,
    "source": {
      "type": "user",
      "userId": userId
    },
    "postback": {
      "data": postback,
      "params": params
    }
  };

  send(sendObject);
}
/* System messages */
function sendFollow() {
  // Craft LINE message
  var sendObject = {
    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
    "type": "follow",
    "timestamp": 1462629479859,
    "source": {
      "type": "user",
      "userId": userId
    }
  };

  send(sendObject);
}
function sendUnfollow() {
  // Craft LINE message
  var sendObject = {
    "type": "unfollow",
    "timestamp": 1462629479859,
    "source": {
      "type": "user",
      "userId": userId
    }
  }

  send(sendObject);
}
function sendJoin() {
  // Craft LINE message
  var sendObject = {
    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
    "type": "join",
    "timestamp": 1462629479859,
    "source": {
      "type": "group",
      "groupId": "C4af4980629..."
    }
  }

  send(sendObject);
}
function sendLeave() {
  // Craft LINE message
  var sendObject = {
    "type": "leave",
    "timestamp": 1462629479859,
    "source": {
      "type": "group",
      "groupId": "C4af4980629..."
    }
  }

  send(sendObject);
}
function sendBeacon() {
  // Craft LINE message
  var sendObject = {
    "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
    "type": "beacon",
    "timestamp": 1462629479859,
    "source": {
      "type": "user",
      "userId": userId
    },
    "beacon": {
      "hwid": $('#hwid')[0].value,
      "type": $('#type')[0].value
    }
  }

  send(sendObject);
}

function toggleKeyboard() {
  var keyboard = $('.chat-keyboard');
  var chatthread = $('.chat-thread');
  if (keyboard.hasClass("visible")) {
    keyboard.removeClass("visible");
    chatthread.removeClass('keyboard')
  }
  else {
    keyboard.addClass("visible");
    chatthread.addClass("keyboard");
  }
}

var zoom = 1;
function zoomin() {
  zoom += 0.1;
  $('.simulator')[0].style.zoom = zoom;
}
function zoomout() {
  zoom -= 0.1;
  $('.simulator')[0].style.zoom = zoom;
}

function toggleMoreMenu() {
  if ($('.moreMenu').hasClass("hide")) {
    $('.moreMenu').removeClass("hide");
  }
  else {
    $('.moreMenu')[0].addClass("hide");
  }
}

function toggleSettings() {
  if ($('.settings').hasClass("hide")) {
    $('.settings').removeClass("hide");
  }
  else {
    $('.settings').addClass("hide");
  }
}

function closeChatRaw() {
  if(!$('.chat-raw').hasClass("hide")){
    $('.chat-raw').addClass("hide");
  }
}

var numOfSim = 1;
function addSimulator() {
  var newSimulator = $('.simulator:first').clone();
  newSimulator.addClass(`simulator${numOfSim}`);
  numOfSim++;
  $('.simulator:last').after(newSimulator);
}