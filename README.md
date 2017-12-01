# LINE Simulator for BOT developer
Are you getting tired using physical device for debug your LINE bot? Yes I am! This project contains simulator to boost your developer productivity.

## Prerequisits
- LINE developer account
- node.js
- And of course your LINE bot app :)
## Setup
```
git clone https://github.com/kenakamu/LINESimulator
npm install
npm start
```

# How this works
This app works as LINE client simnulator as well as LINE Platform simulator. All the request from your bot app shall come to this simulator, and it will redirect to LINE platform if necessary, otherwise it just returns to UI.

## How to use
1. Follow the setup to run the simulator. By default it uses port 8080. If you dont' like it, change it in the source code.
1. In your bot app, specify http://localhost:8080 as your LINE URL.
1. In the simulator, enter your Bot API URL, user id, channel secret and token, then click "connect".<br/>![settings.png](.\readme_img\settings.png)
1. In the chat bar, enter any text and hit "Enter" or click send icon.<br/>![chatbar.png](.\readme_img\chatbar.png)
1. Depending on your implementaion, you can see reply.<br/>![chatreply.png](.\readme_img\chatreply.png)

## Update settings
1. Simply click gear icon.
1. Change settings and click connect.

## zoom
1. Click zoomin or zoomout in menu.<br/>![zoom.png](.\readme_img\zoom.png)
1. Confirm the only simulator zoomin/out.

## Keyboard
1. Click keyboard icon either in chatbar or in menu.<br/>![keyboard.png](.\readme_img\keyboard.png)
1. You see keyboard is appearing in the chat. You cannot type via keyboard image but you see how it hides the window.<br/>![withkeyboard.png](.\readme_img\withkeyboard.png)

## Send non-text
1. Click "Right arrow" icon either in chatbar or in menu.<br/>![keyboard.png](.\readme_img\keyboard.png)
1. Use the more menu area to send any non-text data.<br/>![moremenu.png](.\readme_img\moremenu.png)

## See the JSON object
1. Select any sent or replied area.
1. You see JSON object.<br/>![confirmjson.png](.\readme_img\confirmjson.png)
1. Click close icon to close it.

# Features
At the moment, the simulator can:
- Send text, image, location, sticker, system events.
- Display text
- Display image/video
- Display buttons, confirm, carousel templates
- Handle actions from templates

## Feature to be added
- URL actions
- Rich menus
- Rich image