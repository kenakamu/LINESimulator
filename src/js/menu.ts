//#region menus
{
    let keyboard = $('.chat-keyboard');
    let chatthread = $('.chat-thread');
    let richmenu = $('.chat-richmenu');
    let chatbar = $('.chat-bar');
    let chatbarrichmenu = $('.chat-bar-richmenu');
    let chatthreadUl = $(".chat-thread ul");
    let simulator = $('.simulator');
    let simulatorWrap = $('.simulator-wrap');
    let moreMenu = $('.moreMenu');
    let settings = $('.settings');
    let chatRaw = $('.chat-raw');

    function toggleKeyboard() {
        chatthread.removeClass('richmenu');
        richmenu.removeClass('visible');
        chatbar.addClass('visible');
        chatbarrichmenu.removeClass('visible');

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
    function exit() {
        window.close();
    }
    function zoomin() {
        if (screenHeigt != screen.availHeight) {
            resetSize();
        }
        else {
            zoom += 0.1;
            resize();
        }
    }
    function zoomout() {
        if (screenHeigt != screen.availHeight) {
            resetSize();
        }
        else {
            zoom -= 0.1;
            resize();
        }
    }
    function resize() {
        var originalWith = simulatorWrap.width();
        var originalHeight = simulatorWrap.height();
        simulator[0].style.transform = `scale(${zoom})`;
        simulatorWrap.width(simulator.width() * zoom);
        simulatorWrap.height(simulator.height() * zoom);
        if (!pocMode) {
            window.resizeTo(window.innerWidth + (simulatorWrap.width() - originalWith), window.innerHeight + (simulatorWrap.height() - originalHeight));
        }
    }
    function refresh() {
        chatthreadUl.children().remove();
        chatthreadUl.append('<li class="chat-top-space"></li>');
        messageId = new Date().toString();
    }
    function toggleMoreMenu() {
        if (moreMenu.hasClass("hide")) {
            if (!pocMode) {
                window.resizeTo(window.innerWidth + 500, window.innerHeight);
            }
            moreMenu.removeClass("hide");
        }
        else {
            if (!pocMode) {
                window.resizeTo(window.innerWidth - 500, window.innerHeight);
            }
            moreMenu.addClass("hide");
        }
    }
    function toggleRichMenu() {
        keyboard.removeClass('visible');
        chatthread.removeClass('keyboard');

        if (richmenu.hasClass('visible')) {
            richmenu.removeClass('visible');
            chatthread.removeClass('richmenu');
            chatbarrichmenu.removeClass('visible');
            chatbar.addClass('visible');
        }
        else {
            $.ajax({
                url: `/richmenu/${userId}/${localStorage.getItem('richMenuId')}`,
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
                                if (area.action.text) {
                                    imgDiv += `<area shape="rect" coords="${area.bounds.x * scale},${area.bounds.y * scale},${area.bounds.width * scale + area.bounds.x * scale},${area.bounds.height * scale + area.bounds.y * scale}" href="javascript:sendPostback('${area.action.data}');sendTextMessage('${area.action.text}');">`;
                                }
                                else {
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
    function toggleRawData() {
        if (chatRaw.hasClass("hide")) {
            if (!pocMode) {
                window.resizeTo(window.innerWidth + 700, window.innerHeight);
            }
            chatRaw.removeClass("hide");
        }
        else {
            if (!pocMode) {
                window.resizeTo(window.innerWidth - 700, window.innerHeight);
            }
            chatRaw.addClass("hide");
        }
    }
    function closeChatRaw() {
        if (!chatRaw.hasClass("hide")) {
            chatRaw.addClass("hide");
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
        reader.readAsDataURL((<HTMLInputElement>$('#loadJsonFile')[0]).files[0]);
    }
    //#endregion
}