{
    let chatRaw = $('.chat-raw');
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

    function showRawData() {
        if (chatRaw.hasClass("hide")) {
            chatRaw.removeClass("hide");
        }
    }
}