(function () {
  // Load settings at startup
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

  // Handle key down event for bot textarea
  function sendByEnterFromBot(e) {
    let code = (e.keyCode ? e.keyCode : e.which);
    if (code == 13) { //Enter keycode                        
      sendTextFromBot();
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

  // Craete sockect for bi-directional real-time communication.
  var socket = io();
  socket.on('reply', function (data) {
    receiveMessages(data);
  });

  // Handle binding
  function bindHandlers() {
    $('#message-to-send').bind("keypress", {}, sendByEnter);
    $('#message-from-bot').bind("keypress", {}, sendByEnterFromBot);
    $('.chat-raw').bind("keydown", {}, selectRaw);
    $(document).bind("keydown", {}, disableCtrlA);

    $('#confirm-title').on("input", () => { syncPreviewValue('confirm-title', false); });
    $('#confirm-yes').on("input", () => { syncPreviewValue('confirm-yes', false); });
    $('#confirm-no').on("input", () => { syncPreviewValue('confirm-no', false); });
    $('#buttons-image').on("change", () => { syncPreviewImage('buttons-image'); });
    $('#buttons-title').on("input", () => { syncPreviewValue('buttons-title', true); });
    $('#buttons-text').on("input", () => { syncPreviewValue('buttons-text', false); });
    $('#buttons-action-1').on("input", () => { syncPreviewValue('buttons-action-1', true); });
    $('#buttons-action-2').on("input", () => { syncPreviewValue('buttons-action-2', true); });
    $('#buttons-action-3').on("input", () => { syncPreviewValue('buttons-action-3', true); });
    $('#buttons-action-4').on("input", () => { syncPreviewValue('buttons-action-4', true); });

    $('#loadJsonFile').on("change", () => { loadJson(); });

    // Tab menu
    $('.nav-tabs a').click(function (e) {
      e.preventDefault()
      $(this).tab('show')
    })
    // dropdown menu
    $('.dropdown a').click(function (e) {
      $(this).parents('div:first').children('.btn').text($(this).text());
    })
  }

  // Update time every minutes,
  setInterval(updateTime, 60000);
  loadSettings();
  // Setup key pressdown event.
  bindHandlers();

}());

//#region settings

var userId = "";
function setSettings() {
  pocMode = false;
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
        setPocMode(false);
      },
      error: function (xhr, ajaxOptions, thrownError) {
        $('.warning')[0].innerText = `Error : ${JSON.parse(xhr.responseText).message}`;
      }
    });
  }
}

var pocMode;
function setPocMode(mode) {
  pocMode = mode;
  if (pocMode && $('.bot-chat').hasClass('hide')) {
    $('.bot-chat').removeClass('hide');
  }
  else if (!pocMode && !$('.bot-chat').hasClass('hide')) {
    $('.bot-chat').addClass('hide');
  }
  $.ajax({
    url: "/pocMode",
    type: "POST",
    data: {
      "pocMode": pocMode
    },
    success: function (data) {
      $('.warning')[0].innerText = "";
      toggleSettings();
    }
  });
}
//#endregion

// Handle Chat Item select event.
function onSelectChatItem(obj) {
  if (pocMode) {
    $('.chat-item-tool').remove();
    $(obj).after(`<li tabindex="1" class="chat-item-tool active-li">
        <div>
          <i class="fa fa-trash-o fa-inverse fa-2x" onclick="removeChatItem(this);"></i>
          <i class="fa fa-arrow-up fa-inverse fa-2x" onclick="moveItem(this, true)"></i>
          <i class="fa fa-arrow-down fa-inverse fa-2x" onclick="moveItem(this, false)"></i>
          <i class="fa fa-times fa-inverse fa-2x right" onclick="{$('.chat-item-tool').remove();}"></i>
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
    if ($('.chat-raw').hasClass("hide")) {
      $('.chat-raw').removeClass("hide");
    }
  }
}

function moveItem(obj, up) {
  let target;
  if (up) {
    target = $(obj).parents('li').prev().prev()
    $(obj).parents('li').prev().insertBefore(target);
    $(obj).parents('li').insertBefore(target);
  }
  else {
    target = $(obj).parents('li').next();
    origin = $(obj).parents('li').prev();
    origin.insertAfter(target);
    $(obj).parents('li').insertAfter(origin);
  }

}

function removeChatItem(obj) {
  $(obj).parents('li').prev().remove();
  $(obj).parents('li').remove();
}

//#region append chat item 
// Parse LINE message object into HTML list item.
// tabindex attribute is neccesary to set focus on it for auto scroll to bottom.
function parseDataAndReturnListItem(data) {
  if (data.type == "text") {
    var reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-text" onclick='onSelectChatItem($(this))'>${data.text}</li>`;
  }
  else if (data.type == "sticker") {
    var reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-sticker" onclick='onSelectChatItem($(this))'>stickerId:<br/>${data.stickerId}</li>`;
  }
  else if (data.type == "image") {
    var reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-img" onclick='onSelectChatItem($(this))'><img src="${data.previewImageUrl}"/></li>`;
  }
  else if (data.type == "location") {
    var reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-location" onclick='onSelectChatItem($(this))'>
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
  else if (data.type == "video") {
    var reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-img" onclick='onSelectChatItem($(this))'>
              <video controls autoplay>
                  <source src="${data.originalContentUrl}" type="video/mp4>
                </video>
          </li>`
  }
  else if (data.type == "audio") {
    let audioId = Date.now();
    let audioLength = data.duration;
    let minutes = Math.floor(audioLength / 60000);
    let seconds = ((audioLength % 60000) / 1000).toFixed(0);
    var reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-audio" onclick='onSelectChatItem($(this))'>
        <i class="fa fa-play-circle fa-lg" onclick="play('#${audioId}');"></i> ${minutes + ":" + (seconds < 10 ? '0' : '') + seconds}　　-----------
        <audio id="${audioId}">
            <source src="${data.originalContentUrl}">
        </audio>
    </li>`
  }
  else if (data.type == "template") {
    if (data.template.type == "buttons") {
      var reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-template chat-template-buttons" onclick='onSelectChatItem($(this))'>`;
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
          reply += `<div class="chat-template-buttons-button"><a href="${action.uri}" target="_blank">${action.label}</a></div>`;
        }
      }
      reply += '</li>';
    }
    else if (data.template.type == "confirm") {
      var reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-bot chat-template chat-template-confirm" onclick='onSelectChatItem($(this))'>
      <div class="chat-template-confirm-text">${data.template.text}</div>`;
      for (let i = 0; i < data.template.actions.length; i++) {
        let action = data.template.actions[i];
        let action_class = 'chat-template-confirm-' + ( ( i == 0 ) ? 'yes' : 'no' );
        if (action.type == "postback") {
          let action_text = action.displayText || action.text;
          if (action_text) {
            reply += `<div class="${action_class}" onclick="{sendPostback('${action.data}');sendTextMessage('${action_text}', true);}">${action.label}</div>`;
          }
          else {
            reply += `<div class="${action_class}" onclick="{sendPostback('${action.data}');}">${action.label}</div>`;
          }
        }
        else if (action.type == "message") {
          reply += `<div class="${action_class}" onclick="{sendTextMessage('${action.text}');}">${action.label}</div>`;
        }
      }
      reply += '</li>';
    }
    else if (data.template.type == "carousel") {
      var reply = `<li class="chat-bot chat-icon-only"></li>
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
            reply += `<div class="chat-template-buttons-button"><a href="${action.uri}" target="_blank">${action.label}</a></div>`;
          }
        }
        reply += `</div>`;
      }

      reply += `</li>`;
    }
    else if (data.template.type == "image_carousel") {
      var reply = `<li class="chat-bot chat-icon-only"></li>
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
          reply += `<div class="chat-template-image-carousel-button-content"><a href="${action.uri}" target="_blank">${action.label}</a></div>`;
        }

        reply += `</div></div>`;


      }

      reply += `</li>`;
    }
  }
  else if (data.type == "imagemap") {
    let imagemapId = Date.now();
    var reply = `<li tabindex="1" data='${JSON.stringify(data)}' class="chat-imagemap" onclick='onSelectChatItem($(this))'>
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
// Append user input item to chat body
function appendUserInputToThread(sendObject, path) {
  let chatThread = $(".chat-thread ul");
  let message = sendObject.message;
  if (message.type === "text") {
    chatThread.append(`<li tabindex="1" data='${JSON.stringify(sendObject)}' 
    class="chat-user chat-text" 
    onclick='onSelectChatItem($(this))'>
    ${message.text}</li>`);
  }
  else if (message.type === "image") {

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
      <i class="fa fa-play-circle fa-lg" onclick="play('#${audioId}');"></i> 11:11　　-----------
      <audio id="${audioId}" src="${path}"><audio>
    </li>`);
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
// Append bot input item to chat body
function appendBotReplyToThread(data) {
  let chatThread = $(".chat-thread ul");
  chatThread.append(data);
  $('.chat-thread li').last().addClass('active-li').focus();
  $('#message-to-send')[0].focus();
}

//#endregion

//#region Send data to local API

// upload file.  !!!Need file types.
function uploadFile() {
  var filename = $("#filename")[0].value;
  // Read file data
  var reader = new FileReader();
  // Callback when file read.
  reader.onload = function (event) {
    $("#filename")[0].value = "";
    let result = event.target.result;
    var sendObject = { "filename": filename, "userId": userId, "base64string": result };

    $.ajax({
      url: "/upload",
      type: "POST",
      data: sendObject,
      success: function (data) {
        appendMediaToThread(data);
      }
    });
  };
  reader.readAsDataURL($("#filename")[0].files[0]);
}
// Send text from text area.
function sendFromChatBox() {
  var text = $('#message-to-send')[0].value;
  // Reset input
  $('#message-to-send')[0].value = "";
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
function sendTextMessage(text, displayOnly) {
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
      "text": text
    }
  };

  appendUserInputToThread(sendObject);
  if ( ! displayOnly ) {
    send(sendObject);
  }
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
  appendUserInputToThread(sendObject);
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
  appendUserInputToThread(sendObject);
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
//#endregion

//#region Send data as Bot (POC features)
// Send text as bot
function sendTextFromBot() {
  let inputMessage = $('#message-from-bot')[0].value;
  // Reset input
  $('#message-from-bot')[0].value = "";
  let data = {
    "type": "text",
    "text": inputMessage
  }
  let li = parseDataAndReturnListItem(data);
  // append the reply.
  appendBotReplyToThread(li);
}
// Send image as bot
function uploadFileFromBot(message) {
  // if it contains fakepath, then get actual data and send it to server.
  let reader = new FileReader();
  reader.onload = function (event) {
    let filename = $("#filename-from-bot")[0].value;
    let fileext = filename.split('.')[1];
    let type = "file";
    let data = {};
    $("#filename-from-bot")[0].value = "";
    if (fileext === "mp4") {
      type = "video";
    }
    else if (fileext === "png" || fileext === "jpeg" || fileext === "jpg") {
      type = "image";
    }
    else if (fileext === "m4a") {
      type = "audio"
    }
    let filedata = event.target.result;
    // Craft LINE message
    if (type === "video") {
      data = {
        "type": "video",
        "originalContentUrl": filedata,
        "previewImageUrl": filedata
      }
    }
    else if (type === "image") {
      data = {
        "type": "image",
        "originalContentUrl": filedata,
        "previewImageUrl": filedata
      }
    }
    else if (type === "audio") {
      data = {
        "type": "audio",
        "originalContentUrl": filedata,
        "duration": 0
      }
    }

    let li = parseDataAndReturnListItem(data);
    // append the reply.
    appendBotReplyToThread(li);
  };
  reader.readAsDataURL($("#filename-from-bot")[0].files[0]);
}
function sendStickerFromBot() {
  // Craft LINE message
  let data = {
    "type": "sticker",
    "packageId": $('#packageId-from-bot')[0].value,
    "stickerId": $('#stickerId-from-bot')[0].value
  };
  let li = parseDataAndReturnListItem(data);
  appendBotReplyToThread(li);
}
function sendAddressFromBot() {
  // Craft LINE message
  let data = {
    "type": "location",
    "title": $('#title-from-bot')[0].value,
    "address": $('#address-from-bot')[0].value,
    "latitude": $('#latitude-from-bot')[0].value,
    "longitude": $('#longitude-from-bot')[0].value
  };
  let li = parseDataAndReturnListItem(data);
  appendBotReplyToThread(li);
}
function sendConfirmFromBot() {
  var data = {
    "type": "template",
    "altText": "this is a confirm template",
    "template": {
      "type": "confirm",
      "text": $('#confirm-title')[0].value,
      "actions": [
        {
          "type": "message",
          "label": $('#confirm-yes')[0].value,
          "text": $('#confirm-yes')[0].value
        },
        {
          "type": "message",
          "label": $('#confirm-no')[0].value,
          "text": $('#confirm-no')[0].value
        }
      ]
    }
  }
  let li = parseDataAndReturnListItem(data);
  appendBotReplyToThread(li);
}
// Send Buttons
function syncPreviewValue(elementName, hideWithoutValue) {
  let previewElem = $(`#preview-${elementName}`);
  let originalElem = $(`#${elementName}`);
  if (hideWithoutValue) {
    if (originalElem[0].value === "" && !previewElem.hasClass("hide")) {
      previewElem.addClass("hide");
    }
    else if (originalElem[0].value !== "" && previewElem.hasClass("hide")) {
      previewElem.removeClass("hide");
    }
  }
  previewElem[0].innerText = originalElem[0].value;
}
function syncPreviewImage(elementName) {
  var reader = new FileReader();
  reader.onload = function (event) {
    let previewElem = $(`#preview-${elementName}`);
    if (previewElem.hasClass("hide")) {
      previewElem.removeClass("hide");
    }
    // Render thumbnail.
    event.target.result;
    previewElem.css("background-image", `url(${event.target.result})`);
  };

  // Read in the image file as a data URL.
  reader.readAsDataURL($(`#${elementName}`)[0].files[0]);
}
function removePreviewImage(elementName) {
  $(`#${elementName}`).val('');
  let previewElement = $(`#preview-${elementName}`);
  previewElement.css("background-image", ``);
  previewElement.addClass('hide');
}
function sendButtonsFromBot() {
  var data = {
    "type": "template",
    "altText": "this is a buttons template",
    "template": {
      "type": "buttons",
      "imageAspectRatio": "rectangle",
      "imageSize": "cover",
      "imageBackgroundColor": "#FFFFFF",
      "title": $('#buttons-title')[0].value,
      "text": $('#buttons-text')[0].value,
      "actions": [

      ]
    }
  }

  for (let i = 0; i < $('.buttons-actions').length; i++) {
    let actionElement = $('.buttons-actions')[i];
    if ($('input', actionElement)[0].value !== "") {
      let type = $('button', actionElement)[0].innerText;
      if (type === "message") {
        data.template.actions.push({
          "type": type,
          "label": $('input', actionElement)[0].value,
          "text": $('input', actionElement)[1].value
        })
      }
      else if (type === "postback") {
        data.template.actions.push({
          "type": type,
          "label": $('input', actionElement)[0].value,
          "text": $('input', actionElement)[0].value,
          "data": $('input', actionElement)[1].value
        })
      }
      else if (type === "uri") {
        data.template.actions.push({
          "type": type,
          "label": $('input', actionElement)[0].value,
          "uri": $('input', actionElement)[1].value
        })
      }
    }
  }
  if ($('#preview-buttons-image')[0].style['background-image'] !== "") {
    data.template.thumbnailImageUrl = $('#preview-buttons-image')[0].style['background-image'];
  }

  let li = parseDataAndReturnListItem(data);
  appendBotReplyToThread(li);
}
// Carousel
var colNum = 0;
function removeCarouselPreviewImage(elementName) {
  $(`#${elementName}`).val('');
  let previewElement = $(`#preview-${elementName}-${colNum}`);
  previewElement.css("background-image", ``);
  previewElement.addClass('hide');
}
function addColumn() {
  colNum = $('#preview-chat-template-carousel')[0].children.length;
  $('#preview-chat-template-carousel').append(
    `<div class="chat-template-buttons" onclick="selectColumn(${colNum});">
    <div class="chat-template-buttons-image hide" id="preview-carousel-image-${colNum}"></div>
    <div class="chat-template-buttons-title hide" id="preview-carousel-title-${colNum}"></div>
    <div class="chat-template-buttons-text" id="preview-carousel-text-${colNum}"></div>
    <div class="chat-template-buttons-button" id="preview-carousel-action-1-${colNum}"></div>
    <div class="chat-template-buttons-button hide" id="preview-carousel-action-1-data-${colNum}"></div>
    <div class="chat-template-buttons-button hide" id="preview-carousel-action-1-type-${colNum}">message</div>
    <div class="chat-template-buttons-button hide" id="preview-carousel-action-2-${colNum}"></div>
    <div class="chat-template-buttons-button hide" id="preview-carousel-action-2-data-${colNum}"></div>
    <div class="chat-template-buttons-button hide" id="preview-carousel-action-2-type-${colNum}">message</div>
    <div class="chat-template-buttons-button hide" id="preview-carousel-action-3-${colNum}"></div>
    <div class="chat-template-buttons-button hide" id="preview-carousel-action-3-data-${colNum}"></div>
    <div class="chat-template-buttons-button hide" id="preview-carousel-action-3-type-${colNum}">message</div>
    </div>`
  );
  selectColumn(colNum);
}
function removeColumn() {
  $('#preview-chat-template-carousel')[0].children[colNum].remove();
}
function selectColumn(columnNumber) {
  colNum = columnNumber;
  $('#carousel-image').val('');
  $('#carousel-image').on("change", () => { syncCarouselPreviewImage('carousel-image'); });
  $('#carousel-title').on("input", () => { syncCarouselPreviewValue('carousel-title', true); });
  $('#carousel-text').on("input", () => { syncCarouselPreviewValue('carousel-text', false); });
  $('#carousel-action-1').on("input", () => { syncCarouselPreviewValue('carousel-action-1', true); });
  $('#carousel-action-1-data').on("input", () => { syncCarouselPreviewValue('carousel-action-1-data', false); });
  $('#carousel-action-2').on("input", () => { syncCarouselPreviewValue('carousel-action-2', true); });
  $('#carousel-action-2-data').on("input", () => { syncCarouselPreviewValue('carousel-action-2-data', false); });
  $('#carousel-action-3').on("input", () => { syncCarouselPreviewValue('carousel-action-3', true); });
  $('#carousel-action-3-data').on("input", () => { syncCarouselPreviewValue('carousel-action-3-data', false); });
  $('#carousel .dropdown-menu a').on("click", (e) => { syncCarouselPreviewButtonValue(e.currentTarget); });
  setColumnValueToOriginal('carousel-title');
  setColumnValueToOriginal('carousel-text');
  setColumnValueToOriginal('carousel-action-1');
  setColumnValueToOriginal('carousel-action-1-data');
  setColumnButtonValueToOriginal('carousel-action-1-type');
  setColumnValueToOriginal('carousel-action-2');
  setColumnValueToOriginal('carousel-action-2-data');
  setColumnButtonValueToOriginal('carousel-action-2-type');
  setColumnValueToOriginal('carousel-action-3');
  setColumnValueToOriginal('carousel-action-3-data');
  setColumnButtonValueToOriginal('carousel-action-3-type');

  function setColumnValueToOriginal(elementName) {
    let previewElem = $(`#preview-${elementName}-${colNum}`);
    let originalElem = $(`#${elementName}`);

    originalElem[0].value = previewElem[0].innerText;
  }

  function setColumnButtonValueToOriginal(elementName) {
    let previewElem = $(`#preview-${elementName}-${colNum}`);
    let originalElem = $(`#${elementName}`);

    originalElem[0].innerText = previewElem[0].innerText;
  }

  function syncCarouselPreviewValue(elementName, hideWithoutValue) {
    let previewElem = $(`#preview-${elementName}-${colNum}`);
    let originalElem = $(`#${elementName}`);
    if (hideWithoutValue) {
      if (originalElem[0].value === "" && !previewElem.hasClass("hide")) {
        previewElem.addClass("hide");
      }
      else if (originalElem[0].value !== "" && previewElem.hasClass("hide")) {
        previewElem.removeClass("hide");
      }
    }
    previewElem[0].innerText = originalElem[0].value;
  }

  function syncCarouselPreviewButtonValue(element) {
    let originalElem = $(element).parents('div:first').children('.btn:first');
    let previewElem = $(`#preview-${originalElem[0].id}-${colNum}`);
    previewElem[0].innerText = originalElem[0].innerText;
  }

  function syncCarouselPreviewImage(elementName) {
    var reader = new FileReader();
    reader.onload = function (event) {
      let previewElem = $(`#preview-${elementName}-${colNum}`);
      if (previewElem.hasClass("hide")) {
        previewElem.removeClass("hide");
      }
      // Render thumbnail.
      event.target.result;
      previewElem.css("background-image", `url(${event.target.result})`);
    };

    // Read in the image file as a data URL.
    reader.readAsDataURL($(`#${elementName}`)[0].files[0]);
  }
}
function sendCarouselFromBot() {
  let data = {
    "type": "template",
    "altText": "this is a buttons template",
    "template": {
      "type": "carousel",
      "imageAspectRatio": "rectangle",
      "imageSize": "cover",
      "columns": [
      ]
    }
  }

  for (let i = 0; i < $('#preview-chat-template-carousel')[0].children.length; i++) {
    let column = {
      "actions": [
      ]
    }
    if ($(`#preview-carousel-image-${i}`)[0].style['background-image'] !== "") {
      column.thumbnailImageUrl = $(`#preview-carousel-image-${i}`)[0].style['background-image'];
      column.imageBackgroundColor = "#000000";
    }
    if ($(`#preview-carousel-title-${i}`)[0].innerText !== "") {
      column.title = $(`#preview-carousel-title-${i}`)[0].innerText;
    }
    column.text = $(`#preview-carousel-text-${i}`)[0].innerText;

    for (let ai = 1; ai < 4; ai++) {
      if ($(`#preview-carousel-action-${ai}-${i}`)[0].innerText !== "") {
        let type = $(`#preview-carousel-action-${ai}-type-${i}`)[0].innerText;
        if (type === "message") {
          column.actions.push({
            "type": type,
            "label": $(`#preview-carousel-action-${ai}-${i}`)[0].innerText,
            "text": $(`#preview-carousel-action-${ai}-data-${i}`)[0].innerText
          })
        }
        else if (type === "postback") {
          column.actions.push({
            "type": type,
            "label": $(`#preview-carousel-action-${ai}-${i}`)[0].innerText,
            "text": $(`#preview-carousel-action-${ai}-${i}`)[0].innerText,
            "data": $(`#preview-carousel-action-${ai}-data-${i}`)[0].innerText
          })
        }
        else if (type === "uri") {
          column.actions.push({
            "type": type,
            "label": $(`#preview-carousel-action-${ai}-${i}`)[0].innerText,
            "uri": $(`#preview-carousel-action-${ai}-data-${i}`)[0].innerText
          })
        }
      }
    }
    data.template.columns.push(column);
  }

  let li = parseDataAndReturnListItem(data);
  appendBotReplyToThread(li);
  $('#preview-chat-template-carousel')[0].children.remove();
}
// Image Carousel
var imgColNum = 0;
function removeImageCarouselPreviewImage(elementName) {
  $(`#${elementName}`).val('');
  let previewElement = $(`#preview-${elementName}-${imgColNum}`);
  previewElement.css("background-image", ``);
  previewElement.addClass('hide');
}
function addImageColumn() {
  imgColNum = $('#preview-chat-template-image-carousel')[0].children.length;
  $('#preview-chat-template-image-carousel').append(
    `<div class="chat-template-image-carousel" onclick='selectImageColumn(${imgColNum})'>
        <div class="chat-template-image-carousel-image" id="preview-image-carousel-image-${imgColNum}"></div>
        <div class="chat-template-image-carousel-button">
          <div class="chat-template-image-carousel-button-content" id="preview-image-carousel-action-${imgColNum}"></div>
          <div class="hide" id="preview-image-carousel-action-data-${imgColNum}"></div>
          <div class="hide" id="preview-image-carousel-action-type-${imgColNum}">message</div>
        </div>
      </div>`
  );
  selectImageColumn(imgColNum);
}
function removeImageColumn() {
  $('#preview-chat-template-image-carousel')[0].children[imgColNum].remove();
}
function selectImageColumn(columnNumber) {
  imgColNum = columnNumber;
  $('#image-carousel-image').val('');
  $('#image-carousel-image').on("change", () => { syncImageCarouselPreviewImage('image-carousel-image'); });
  $('#image-carousel-action').on("input", () => { syncImageCarouselPreviewValue('image-carousel-action', true); });
  $('#image-carousel-action-data').on("input", () => { syncImageCarouselPreviewValue('image-carousel-action-data', false); });
  $('#imagecarousel .dropdown-menu a').on("click", (e) => { syncImageCarouselPreviewButtonValue(e.currentTarget); });
  setImageColumnValueToOriginal('image-carousel-action');
  setImageColumnValueToOriginal('image-carousel-action-data');
  setImageColumnButtonValueToOriginal('image-carousel-action-type');

  function setImageColumnValueToOriginal(elementName) {
    let previewElem = $(`#preview-${elementName}-${imgColNum}`);
    let originalElem = $(`#${elementName}`);

    originalElem[0].value = previewElem[0].innerText;
  }

  function setImageColumnButtonValueToOriginal(elementName) {
    let previewElem = $(`#preview-${elementName}-${imgColNum}`);
    let originalElem = $(`#${elementName}`);

    originalElem[0].innerText = previewElem[0].innerText;
  }

  function syncImageCarouselPreviewValue(elementName, hideWithoutValue) {
    let previewElem = $(`#preview-${elementName}-${imgColNum}`);
    let originalElem = $(`#${elementName}`);
    if (hideWithoutValue) {
      if (originalElem[0].value === "" && !previewElem.hasClass("hide")) {
        previewElem.addClass("hide");
      }
      else if (originalElem[0].value !== "" && previewElem.hasClass("hide")) {
        previewElem.removeClass("hide");
      }
    }
    previewElem[0].innerText = originalElem[0].value;
  }

  function syncImageCarouselPreviewButtonValue(element) {
    let originalElem = $(element).parents('div:first').children('.btn:first');
    let previewElem = $(`#preview-${originalElem[0].id}-${imgColNum}`);
    previewElem[0].innerText = originalElem[0].innerText;
  }

  function syncImageCarouselPreviewImage(elementName) {
    var reader = new FileReader();
    reader.onload = function (event) {
      let previewElem = $(`#preview-${elementName}-${imgColNum}`);
      if (previewElem.hasClass("hide")) {
        previewElem.removeClass("hide");
      }
      // Render thumbnail.
      event.target.result;
      previewElem.css("background-image", `url(${event.target.result})`);
    };

    // Read in the image file as a data URL.
    reader.readAsDataURL($(`#${elementName}`)[0].files[0]);
  }
}
function sendImageCarouselFromBot() {
  let data = {
    "type": "template",
    "altText": "this is a buttons template",
    "template": {
      "type": "image_carousel",
      "columns": [
      ]
    }
  }

  for (let i = 0; i < $('#preview-chat-template-image-carousel')[0].children.length; i++) {
    let column = {
      "imageUrl": $(`#preview-image-carousel-image-${i}`)[0].style['background-image']
    }

    let type = $(`#preview-image-carousel-action-type-${i}`)[0].innerText;
    if (type === "message") {
      column.action = {
        "type": type,
        "label": $(`#preview-image-carousel-action-${i}`)[0].innerText,
        "text": $(`#preview-image-carousel-action-data-${i}`)[0].innerText
      };
    }
    else if (type === "postback") {
      column.action = {
        "type": type,
        "label": $(`#preview-image-carousel-action-${i}`)[0].innerText,
        "text": $(`#preview-image-carousel-action-${i}`)[0].innerText,
        "data": $(`#preview-image-carousel-action-data-${i}`)[0].innerText
      };
    }
    else if (type === "uri") {
      column.action = {
        "type": type,
        "label": $(`#preview-image-carousel-action-${i}`)[0].innerText,
        "uri": $(`#preview-image-carousel-action-data-${i}`)[0].innerText
      };
    }

    data.template.columns.push(column);
  }

  let li = parseDataAndReturnListItem(data);
  appendBotReplyToThread(li);
  $('#preview-chat-template-image-carousel')[0].children.remove();
}

//#endregion

//#region menus
function toggleKeyboard() {
  var keyboard = $('.chat-keyboard');
  var chatthread = $('.chat-thread');

  chatthread.removeClass('richmenu');
  $('.chat-richmenu').removeClass('visible');
  $('.chat-bar').addClass('visible');
  $('.chat-bar-richmenu').removeClass('visible');

  if (keyboard.hasClass('visible')) {
    keyboard.removeClass('visible');
    chatthread.removeClass('keyboard')
  }
  else {
    keyboard.addClass('visible');
    chatthread.addClass('keyboard');
  }
  $('.chat-thread li').last().focus();
}
var zoom = 1;
function zoomin() {
  var rootStyle = window.getComputedStyle($(':root')[0]);
  zoom += 0.1;
  $('.simulator')[0].style.transform = `scale(${zoom})`;
}
function zoomout() {
  zoom -= 0.1;
  $('.simulator')[0].style.transform = `scale(${zoom})`;
}
function refresh() {
  $(".chat-thread ul").children().remove();
  $(".chat-thread ul").append('<li class="chat-top-space"></li>');
}
function toggleMoreMenu() {
  if ($('.moreMenu').hasClass("hide")) {
    $('.moreMenu').removeClass("hide");
  }
  else {
    $('.moreMenu').addClass("hide");
  }
}
function toggleRichMenu() {
  let richmenu = $('.chat-richmenu');
  let chatthread = $('.chat-thread');
  let chatbar = $('.chat-bar');
  let chatbarrichmenu = $('.chat-bar-richmenu');
  $('.chat-keyboard').removeClass('visible');
  chatthread.removeClass('keyboard');

  if (richmenu.hasClass('visible')) {
    richmenu.removeClass('visible');
    chatthread.removeClass('richmenu');
    chatbarrichmenu.removeClass('visible');
    chatbar.addClass('visible');
  }
  else {
    $.ajax({
      url: `/richmenu/${localStorage.getItem('userId')}/${localStorage.getItem('richMenuId')}`,
      type: "GET",
      success: function (data) {
        if (data.message === "no menu") {
          localStorage.removeItem('richMenuId');
          window.alert("no rich menu for the user");
          // As there is no menu, do nothing.
          return;
        }
        else if (data == "") {
          // As richmenu id didnt changed, do nothing but show rich menu.
        }
        else {
          localStorage.setItem('richMenuId', data.richMenu.richMenuId);
          richmenu[0].innerHTML = "";
          let imgDiv = `<img src="data:image/png;base64,${_arrayBufferToBase64(data.image.data)}" usemap="#richmenumap"/><map name="richmenumap">`;
          let scale = Number($(':root').css('--chat-width').replace('px', '')) / data.richMenu.size.width;
          for (let i = 0; i < data.richMenu.areas.length; i++) {
            let area = data.richMenu.areas[i];
            if (area.action.type === "uri") {
              imgDiv += `<area shape="rect" coords="${area.bounds.x * scale},${area.bounds.y * scale},${area.bounds.width * scale + area.bounds.x * scale},${area.bounds.height * scale + area.bounds.y * scale}" href="${area.action.uri}" target="_blank">`;
            }
            else if (area.action.type === "message") {
              imgDiv += `<area shape="rect" coords="${area.bounds.x * scale},${area.bounds.y * scale},${area.bounds.width * scale + area.bounds.x * scale},${area.bounds.height * scale + area.bounds.y * scale}" href="javascript:sendTextMessage('${area.action.text}');">`;
            }
            else if (area.action.type === "postback") {
              if(area.action.text){
                imgDiv += `<area shape="rect" coords="${area.bounds.x * scale},${area.bounds.y * scale},${area.bounds.width * scale + area.bounds.x * scale},${area.bounds.height * scale + area.bounds.y * scale}" href="javascript:sendPostback('${area.action.data}');sendTextMessage('${area.action.text}');">`;
              }
              else{
                imgDiv += `<area shape="rect" coords="${area.bounds.x * scale},${area.bounds.y * scale},${area.bounds.width * scale + area.bounds.x * scale},${area.bounds.height * scale + area.bounds.y * scale}" href="javascript:sendPostback('${area.action.data}');">`;
              }
            }
          }

          imgDiv += `</map>`

          $(':root').css('--chat-richmenu-height', scale * data.richMenu.size.height + 'px');
          richmenu.append(imgDiv);
          $('.chat-bar-richmenu-item')[0].innerText = data.richMenu.chatBarText;
        }
        richmenu.addClass('visible');
        chatthread.addClass('richmenu');
        chatbarrichmenu.addClass('visible');
        chatbar.removeClass('visible');
        $('.chat-thread li').last().focus();
      }
    });
  }
}
function _arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
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
  if (!$('.chat-raw').hasClass("hide")) {
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
function saveChat() {
  let data = [];
  $('.chat-thread li').each(function () {
    if ($(this).attr('data') != null) {
      let jsonData = JSON.parse($(this).attr('data'));
      // If this is media, then save src as part of export information.
      if ($(this).children('img').attr('src') != null) {
        jsonData.path = $(this).children('img').attr('src');
      }
      data.push(jsonData);
    }
  });
  var a = document.createElement('a');
  a.download = "export_chat.json";
  a.href = 'data:application/json,' + encodeURIComponent(JSON.stringify(data, null, '\t'));
  a.click();
}
function openFileDialogForLoadJson() {
  $('#loadJsonFile').trigger("click");
}
// Load saved chat file
function loadJson() {
  var reader = new FileReader();
  reader.onload = function (event) {

    let data = JSON.parse(window.atob(event.target.result.split(',')[1]));
    data.forEach(function (jsonData) {
      // Check replyToken to see if this is from bot or user.
      if (jsonData.replyToken == null) {
        let li = parseDataAndReturnListItem(jsonData);
        appendBotReplyToThread(li);
      }
      else {
        // If this is from user, then check if it has path, then its media.
        if (jsonData.path == null) {
          appendUserInputToThread(jsonData);
        }
        else {
          let path = jsonData.path;
          delete jsonData.path;
          appendMediaToThread({ "filePath": path, "sendObject": jsonData });
        }
      }
    });
  };

  // Read in the image file as a data URL.
  reader.readAsDataURL($('#loadJsonFile')[0].files[0]);
}
//#endregion
