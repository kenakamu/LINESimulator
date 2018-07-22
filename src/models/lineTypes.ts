enum messageType{
    text="text",
    sticker="sticker",
    image = "image",
    video = "video",
    audio = "audio",
    location= "location",
    template = "template",
    imagemap = "imagemap"
}

class messageSource {
    type: string;
    userId: string;
}

class messageEventBase {
    public replyToken: string;
    public type: string;
    public timestamp: number;
    public source: messageSource;
}

class textMessage_fromUser {
    public id: string;
    private type: string = "text";
    public text: string;

    constructor(id: string, text: string) {
        this.id = id;
        this.text = text;
    }
}

class imageMessage_fromUser {
    public id: string;
    private type: string = "image";

    constructor(id: string) {
        this.id = id;
    }
}

class videoMessage_fromUser {
    public id: string;
    private type: string = "video";

    constructor(id: string) {
        this.id = id;
    }
}

class audioMessage_fromUser {
    public id: string;
    private type: string = "audio";

    constructor(id: string) {
        this.id = id;
    }
}

class fileMessage_fromUser {
    public id: string;
    private type: string = "file";
    public fileName: string;
    public fileSize: number;

    constructor(id: string, fileName: string, fileSize: number) {
        this.id = id;
        this.fileName = fileName;
        this.fileSize = fileSize;
    }
}

class locationMessage_fromUser {
    public id: string;
    private type: string = "location";
    public title: string;
    public address: string;
    public latitude: number;
    public longitude: number;

    constructor(id: string, title: string, address: string, latitude: number, longitude: number) {
        this.id = id;
        this.title = title;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}

class stickerMessage_fromUser {
    public id: string;
    private type: string = "sticker";
    public packagedId: string;
    public stickerId: string;

    constructor(id: string, packagedId: string, stickerId: string) {
        this.id = id;
        this.packagedId = packagedId;
        this.stickerId = stickerId;
    }
}

class postback_fromUser {
    data: string;
    params: postbackParam;
}

class postbackParam {
    public date: string;
    public time: string;
    public datetime: string;
}

class beacon_fromUser {
    hwid: string;
    type: beaconType;
}

enum beaconType {
    enter = "enter",
    leave = "leave",
    banner = "banner"
}

class accountLink_fromUser {
    link: link;
}

class link {
    public result: string;
    public nonce: string;
}

class textMessage extends messageEventBase {
    public message: textMessage_fromUser;

    constructor(replyToken: string, timestamp: number, userId: string, messageId: string, text: string) {
        super();
        this.replyToken = replyToken;
        this.type = "message";
        this.timestamp = timestamp;
        this.source = { type: "user", userId: userId };
        this.message = new textMessage_fromUser(messageId, text);
    }
}

class stickerMessage extends messageEventBase {
    public message: stickerMessage_fromUser;

    constructor(replyToken: string, timestamp: number, userId: string, messageId: string, packageId: string, stickerId: string) {
        super();
        this.replyToken = replyToken;
        this.type = "message";
        this.timestamp = timestamp;
        this.source = { type: "user", userId: userId };
        this.message = new stickerMessage_fromUser(messageId, packageId, stickerId);
    }
}

class imageMessage extends messageEventBase {
    public message: imageMessage_fromUser;

    constructor(replyToken: string, timestamp: number, userId: string, messageId: string) {
        super();
        this.replyToken = replyToken;
        this.type = "message";
        this.timestamp = timestamp;
        this.source = { type: "user", userId: userId };
        this.message = new imageMessage_fromUser(messageId);
    }
}

class videoMessage extends messageEventBase {
    public message: videoMessage_fromUser;

    constructor(replyToken: string, timestamp: number, userId: string, messageId: string) {
        super();
        this.replyToken = replyToken;
        this.type = "message";
        this.timestamp = timestamp;
        this.source = { type: "user", userId: userId };
        this.message = new videoMessage_fromUser(messageId);
    }
}

class audioMessage extends messageEventBase {
    public message: audioMessage_fromUser;

    constructor(replyToken: string, timestamp: number, userId: string, messageId: string) {
        super();
        this.replyToken = replyToken;
        this.type = "message";
        this.timestamp = timestamp;
        this.source = { type: "user", userId: userId };
        this.message = new audioMessage_fromUser(messageId);
    }
}

class locationMessage extends messageEventBase {
    public message: locationMessage_fromUser;

    constructor(replyToken: string, timestamp: number, userId: string, messageId: string, title: string, address: string, latitude: number, longitude: number) {
        super();
        this.replyToken = replyToken;
        this.type = "message";
        this.timestamp = timestamp;
        this.source = { type: "user", userId: userId };
        this.message = new locationMessage_fromUser(messageId, title, address, latitude, longitude);
    }
}

class postbackMessage extends messageEventBase {
    public postback: postback_fromUser;

    constructor(replyToken: string, timestamp: number, userId: string, data: string, date?: string, time?: string, datetime?: string) {
        super();
        this.replyToken = replyToken;
        this.type = "postback";
        this.timestamp = timestamp;
        this.source = { type: "user", userId: userId };
        this.postback = { data: data, params: { date, time, datetime } }
    }
}

class followMessage extends messageEventBase {
    constructor(replyToken: string, timestamp: number, userId: string) {
        super();
        this.replyToken = replyToken;
        this.type = "follow";
        this.timestamp = timestamp;
        this.source = { type: "user", userId: userId };
    }
}

class unfollowMessage extends messageEventBase {
    constructor(replyToken: string, timestamp: number, userId: string) {
        super();
        this.replyToken = replyToken;
        this.type = "unfollow";
        this.timestamp = timestamp;
        this.source = { type: "user", userId: userId };
    }
}

class joinMessage extends messageEventBase {
    constructor(replyToken: string, timestamp: number, groupId: string) {
        super();
        this.replyToken = replyToken;
        this.type = "join";
        this.timestamp = timestamp;
        this.source = { type: "group", userId: groupId };
    }
}

class leaveMessage extends messageEventBase {
    constructor(replyToken: string, timestamp: number, groupId: string) {
        super();
        this.replyToken = replyToken;
        this.type = "leave";
        this.timestamp = timestamp;
        this.source = { type: "group", userId: groupId };
    }
}

class beaconMessage extends messageEventBase {
    public beacon: beacon_fromUser;

    constructor(replyToken: string, timestamp: number, userId: string, hwid: string, beaconType: beaconType) {
        super();
        this.replyToken = replyToken;
        this.type = "beacon";
        this.timestamp = timestamp;
        this.source = { type: "user", userId: userId };
        this.beacon = { hwid: hwid, type: beaconType };
    }
}

class textMessage_toUser {
    private type: string = "text";
    public text: string;

    constructor(text: string) {
        this.text = text;
    }
}

class stickerMessage_toUser {
    private type: string = "sticker";
    public packageId: string;
    public stickerId: string;

    constructor(packageId: string, stickerId: string) {
        this.packageId = packageId;
        this.stickerId = stickerId;
    }
}

class imageMessage_toUser {
    private type: string = "image";
    public originalContentUrl: string;
    public previewImageUrl: string;

    constructor(originalContentUrl: string, previewImageUrl: string) {
        this.originalContentUrl = originalContentUrl;
        this.previewImageUrl = previewImageUrl;
    }
}

class videoMessage_toUser {
    private type: string = "video";
    public originalContentUrl: string;
    public previewImageUrl: string;
    
    constructor(originalContentUrl: string, previewImageUrl: string) {
        this.originalContentUrl = originalContentUrl;
        this.previewImageUrl = previewImageUrl;
    }
}

class audioMessage_toUser {
    private type: string = "audio";
    public originalContentUrl: string;
    public duration: number;
    
    constructor(originalContentUrl: string, duration: number) {
        this.originalContentUrl = originalContentUrl;
        this.duration = duration;
    }
}

class locationMessage_toUser {
    private type: string = "location";
    public title: string;
    public address: string;
    public latitude: number;
    public longitude: number;

    constructor(title: string, address: string, latitude: number, longitude: number) {
        this.title = title;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
    }
}