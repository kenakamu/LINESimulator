/// <reference path="../models/lineTypes.ts" />

{
    const electron = require('electron');
    const ipc = electron.ipcRenderer;
  
    let data: string;
    let mode: string;

    $('#submit').on('click', () => {
        let arg = { data: "", param: new postbackParam() };
        let result = (<HTMLInputElement>$('#datetime')[0]).value;
        arg.data = data;
        if (mode === "date") {
            arg.param.date = result.split('T')[0];
        }
        else if (mode === "time") {
            arg.param.time = result.split('T')[1];
        }
        else {
            arg.param.datetime = result;
        }

        ipc.send('datetimepicker-result', arg);
        electron.remote.getCurrentWindow().close();
    });

    ipc.on('datetimepicker-object', (event, arg) => {
        data = arg.data;
        mode = arg.mode;
        $('#data').text(data);
        $('#mode').text(mode);
        $('#initial').text(arg.initial);
        $('#max').text(arg.max);
        $('#min').text(arg.min);
        if (arg.initial != "undefined") {
            (<HTMLInputElement>$('#datetime')[0]).defaultValue = arg.initial;
        }
        else {
            let now = new Date();
            let month: number = now.getMonth() + 1;
            let date: number = now.getDate();
            let mm: string = month > 9 ? month.toString() : '0' + month.toString();
            let dd: string = date > 9 ? date.toString() : '0' + date.toString();
            (<HTMLInputElement>$('#datetime')[0]).defaultValue = `${now.getFullYear()}-${mm}-${dd}T00:00:00`;
        }
        //mode:mode, initial:initial, max:max, min:min
    });
}