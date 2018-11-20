{    
    function autoPlay(){
        autoPlayMode = true;
        let inputs = $('.inputs').val().toString().split('\n');
         
        if(inputs.length != autoPlayIndex){
            sendTextMessage(inputs[autoPlayIndex]);
            autoPlayIndex++;
        }
        else{
            autoPlayMode = false;
            autoPlayIndex = 0;
        }
    }
    let autoPlayIndex = 0;
    var autoPlayMode = false;
}