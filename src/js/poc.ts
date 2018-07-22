(function () {
  // Handle binding
  function bindHandlers() {
    $('#message-from-bot').bind("keypress", {}, sendByEnterFromBot);

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
   // $('#buttons-action-1-type').on("change", () => { updateOptions(); });

    // Tab menu
    $('.nav-tabs a').click(function (e) {
      e.preventDefault();
      (<any>$(this)[0]).tab('show')
    })
    // dropdown menu
    $('.dropdown a').click(function (e) {
      $(this).parents('div:first').children('.btn').text($(this).text());
    })
  }

  // Setup key pressdown event.
  bindHandlers();
}());

function updateOptions(){
  let type = $('#buttons-action-1-type').val();
}
function moveItem(obj, up) {
  let target;
  let origin;
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

// Handle key down event for bot textarea
function sendByEnterFromBot(e) {
  let code = (e.keyCode ? e.keyCode : e.which);
  if (code == 13) { //Enter keycode     
    e.preventDefault();
    sendTextFromBot();
  }
}

// Append bot input item to chat body
function appendBotReplyToThread(data) {
  let chatThread = $(".chat-thread ul");
  chatThread.append(data);
  $('.chat-thread li').last().addClass('active-li').focus();
  $('#message-to-send')[0].focus();
}

//#region Send data as Bot (POC features)
// Send text as bot
function sendTextFromBot() {
  let inputMessage = $('#message-from-bot').val();
  // Reset input
  $('#message-from-bot').val("");
  let data = {
    type: "text",
    text: inputMessage
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
    let filename: string = $("#filename-from-bot").val().toString();
    let fileext = filename.split('.')[1];
    let type = "file";
    let data = {};
    $("#filename-from-bot").val("");
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
      data = new videoMessage_toUser(
        filedata,
        filedata
      );
    }
    else if (type === "image") {
      data = new imageMessage_toUser(
        filedata,
        filedata
      );
    }
    else if (type === "audio") {
      data = new audioMessage_toUser(
        filedata,
        0
      );
    }

    let li = parseDataAndReturnListItem(data);
    // append the reply.
    appendBotReplyToThread(li);
  };
  reader.readAsDataURL((<HTMLInputElement>$("#filename-from-bot")[0]).files[0]);
}
function sendStickerFromBot() {
  // Craft LINE message
  let data = new stickerMessage_toUser(
    $('#packageId-from-bot').val().toString(),
    $('#stickerId-from-bot').val().toString()
  );

  let li = parseDataAndReturnListItem(data);
  appendBotReplyToThread(li);
}
function sendAddressFromBot() {
  // Craft LINE message
  let data = new locationMessage_toUser(
    $('#title-from-bot').val().toString(),
    $('#address-from-bot').val().toString(),
    $('#latitude-from-bot').val() as number,
    $('#longitude-from-bot').val() as number
  );

  let li = parseDataAndReturnListItem(data);
  appendBotReplyToThread(li);
}
function sendConfirmFromBot() {
  var data = {
    "type": "template",
    "altText": "this is a confirm template",
    "template": {
      "type": "confirm",
      "text": $('#confirm-title').val(),
      "actions": [
        {
          "type": "message",
          "label": $('#confirm-yes').val(),
          "text": $('#confirm-yes').val()
        },
        {
          "type": "message",
          "label": $('#confirm-no').val(),
          "text": $('#confirm-no').val()
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
    if (originalElem.val().toString() === "" && !previewElem.hasClass("hide")) {
      previewElem.addClass("hide");
    }
    else if (originalElem.val().toString() !== "" && previewElem.hasClass("hide")) {
      previewElem.removeClass("hide");
    }
  }
  previewElem[0].innerText = originalElem.val().toString();
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
  reader.readAsDataURL((<HTMLInputElement>$(`#${elementName}`)[0]).files[0]);
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
      "title": $('#buttons-title').val(),
      "text": $('#buttons-text').val(),
      "actions": [

      ],
      "thumbnailImageUrl": ""
    }
  }

  for (let i = 0; i < $('.buttons-actions').length; i++) {
    let actionElement = $('.buttons-actions')[i];
    if ($('input', actionElement).val().toString() !== "") {
      let type = $('button', actionElement)[0].innerText;
      if (type === "message") {
        data.template.actions.push({
          "type": type,
          "label": $('input', actionElement).first().val(),
          "text": $('input', actionElement).last().val()
        })
      }
      else if (type === "postback") {
        data.template.actions.push({
          "type": type,
          "label": $('input', actionElement).first().val(),
          "text": $('input', actionElement).last().val(),
          "data": $('input', actionElement).last().val(),
        })
      }
      else if (type === "uri") {
        data.template.actions.push({
          "type": type,
          "label": $('input', actionElement).first().val(),
          "uri":$('input', actionElement).last().val()
        })
      }
    }
  }
  if ($('#preview-buttons-image')[0].style['background-image'] !== "") {
    data.template.thumbnailImageUrl = $('#preview-buttons-image')[0].style['background-image'].toString();
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

    originalElem.val(previewElem[0].innerText);
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
      if (originalElem.val().toString() === "" && !previewElem.hasClass("hide")) {
        previewElem.addClass("hide");
      }
      else if (originalElem.val().toString() !== "" && previewElem.hasClass("hide")) {
        previewElem.removeClass("hide");
      }
    }
    previewElem[0].innerText = originalElem.val().toString();
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
    reader.readAsDataURL((<HTMLInputElement>$(`#${elementName}`)[0]).files[0]);
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
      ],
      "thumbnailImageUrl": "",
      "imageBackgroundColor": "",
      "title": "",
      "text": ""
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
  //$('#preview-chat-template-carousel')[0].children.remove();
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

    originalElem.val(previewElem[0].innerText.toString());
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
      if (originalElem.val().toString() === "" && !previewElem.hasClass("hide")) {
        previewElem.addClass("hide");
      }
      else if (originalElem.val().toString() !== "" && previewElem.hasClass("hide")) {
        previewElem.removeClass("hide");
      }
    }
    previewElem[0].innerText = originalElem.val().toString();
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
    reader.readAsDataURL((<HTMLInputElement>$(`#${elementName}`)[0]).files[0]);
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
      "imageUrl": $(`#preview-image-carousel-image-${i}`)[0].style['background-image'],
      "action": {},
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
  //$('#preview-chat-template-image-carousel')[0].children.remove();
}

  //#endregion
