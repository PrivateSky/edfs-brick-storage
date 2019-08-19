require("psk-http-client");
const bar = require("bar");
const Brick = bar.Brick;
let PutBrickQueue = require("./EDFSBrickQueue").EDFSPutBrickQueue;
let GetBrickQueue = require("./EDFSBrickQueue").EDFSGetBrickQueue;
let bricksQueue = [];
function EDFSBrickStorage(urls) {

    let putBrickQueue = new PutBrickQueue(30);
    let getBrickQueue = new GetBrickQueue(30);

    if (typeof urls === "string") {
        urls = [urls]
    }

    console.log(urls);
    let urlIndex = -1;

    function getStorageUrlAddress() {
        urlIndex++;
        if (urlIndex >= urls.length) {
            urlIndex = 0;
        }
        return urls[urlIndex];
    }

    this.putBrick = function (brick, callback) {
        let callbackSent = false;

        let handler = function (err, data, headers) {
            if (callbackSent) {
                if (err) {
                    callback(err);
                }
            } else {
                callback(err, data, headers)
            }
        };
        let url = getStorageUrlAddress();

        putBrickQueue.addBrickRequest(url + "/EDFS/" + brick.getHash(),
            brick.getData(),
            handler);

        if (putBrickQueue.getQueueFreeSlots() > 0) {
            callbackSent = true;
            callback();
        }

    };


    function checkBricks() {

            console.log(bricksQueue.length);
            let brickRequest = bricksQueue[0];
            if (brickRequest && brickRequest.data) {
                let data = brickRequest.data;
                brickRequest.callback(data.err, new Brick(data.brickData));
                console.log("Dau inapoi", brickRequest.brickHash);
                bricksQueue.shift();
                checkBricks();
            }
        }

    this.getBrick = function (brickHash, callback) {

        console.log(brickHash);
        let myData = {brickHash: brickHash, callback: callback, data:null}
        bricksQueue.push(myData);

        let url = getStorageUrlAddress();
        getBrickQueue.addBrickRequest(url + "/EDFS/" + brickHash, (err, brickData) => {
            myData.data = {err:err, brickData:brickData};
            checkBricks();
            //callback(err, new Brick(brickData));
        });

    };

    this.deleteBrick = function (brickHash, callback) {
        throw new Error("Not implemented");
    };

    this.putBarMap = function (barMap, callback) {
        const mapBrick = barMap.toBrick();
        console.log(mapBrick.getHash());
        this.putBrick(mapBrick, (err) => {
            callback(err, mapBrick.getHash());
        });
    };

    this.getBarMap = function (mapDigest, callback) {
        if (typeof mapDigest === "function") {
            callback = mapDigest;
            mapDigest = undefined;
        }

        if (typeof mapDigest === "undefined") {
            return callback(undefined, new bar.FolderBarMap());
        }

        this.getBrick(mapDigest, (err, mapBrick) => {
            if (err) {
                return callback(err);
            }

            callback(undefined, new bar.FolderBarMap(JSON.parse(mapBrick.getData().toString())));
        });
    }
}

module.exports = {
    createEDFSBrickStorage(url) {
        return new EDFSBrickStorage(url);
    }
};

