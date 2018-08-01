/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
/// <reference path="../../node_modules/@types/nedb/index.d.ts" />
/// <reference path="../models/lineSettings.ts" />

{
    const electron = require('electron');
    const app = electron.remote.app;
    const path = require('path');
    const nedb = require('nedb');
    const db = new nedb({ filename: path.join(app.getPath('userData'), 'data'), autoload: true })
    const BrowserWindow = electron.remote.BrowserWindow;
    const Menu = electron.remote.Menu;
    const ipc = electron.ipcRenderer;
    const port = 8080;
    let settings: lineSettings;
    let pocMode: boolean = false;
    let indicator = $('.indicator');
    let indicatorMessage = $('#message');

    function loadSettings() {

        indicatorMessage.text("loading data...");
        toggleIndicator();
        // Load data from nedb.
        db.find({}, function (err, docs) {
            if (docs.length > 0) {
                settings = docs[0];

                $("#userId").val(settings.userId);
                $("#channelSecret").val(settings.channelSecret);
                $("#channelToken").val(settings.channelToken);
                $("#botAPIAddress").val(settings.botAPIAddress);
                (<HTMLInputElement>$("#alwaysOnTop")[0]).checked = settings.alwaysOnTop; 
            }
            toggleIndicator();
        });
    }

    function connect() {
        pocMode = false;
        let userId = $("#userId").val().toString();
        let channelSecret = $("#channelSecret").val().toString();
        let channelToken = $("#channelToken").val().toString();
        let botAPIAddress = $("#botAPIAddress").val().toString();

        if (!userId || !channelSecret || !channelToken || !botAPIAddress) {
            $('.warning')[0].innerText = "Please set values";
        }
        else {
            settings = {
                userId: userId,
                channelSecret: channelSecret,
                channelToken: channelToken,
                botAPIAddress: botAPIAddress,
                alwaysOnTop: (<HTMLInputElement>$("#alwaysOnTop")[0]).checked
            };
            indicatorMessage.text("connecting user...");
            toggleIndicator();
            $.ajax({
                url: "/channelSettings",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(settings),
                success: function (data) {
                    $('.warning')[0].innerText = "";
                    runSimulator();
                    toggleIndicator();
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    $('.warning')[0].innerText = `Error : ${JSON.parse(xhr.responseText).message}`;
                    toggleIndicator();
                }
            });
        }
    }

    function poc() {
        pocMode = true;
        $.ajax({
            url: "/pocMode",
            type: "POST",
            data: {
                "pocMode": pocMode
            },
            success: function (data) {
                $('.warning')[0].innerText = "";
                runSimulator(true);
            }
        });
    }
    
    let simulator;
    function runSimulator(pocMode: boolean = false) {
        simulator = new BrowserWindow({
            alwaysOnTop: (<HTMLInputElement>$("#alwaysOnTop")[0]).checked,
            transparent: true,
            frame: false,
            autoHideMenuBar: true,
            width: screen.availWidth,
            height: screen.availHeight,
            show: false
        });
        simulator.on('close', () => {
            simulator = null;
            ipc.send('simulator-status', false);
        });
        simulator.loadURL(`http://localhost:${port}/simulator`);
        simulator.show();
        //simulator.webContents.openDevTools();

        simulator.webContents.once('dom-ready', () => {
            simulator.webContents.send('pocMode', pocMode);
            simulator.show();
            ipc.send('simulator-status', true);
        });

    }
    loadSettings();

    function toggleIndicator() {
        if (indicator.hasClass("hide")) {
            indicator.removeClass("hide");
        }
        else {
            indicator.addClass("hide");
        }
    }
    // ipc to simulator for datetimepicker value
    ipc.on('datetimepicker-result', (event, arg) => {
        simulator.webContents.send('datetimepicker-result', arg);
    });
}