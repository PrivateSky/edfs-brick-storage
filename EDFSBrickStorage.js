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

    let urlIndex = -1;

    let map;

    this.setBarMap = function (barMap) {
        map = barMap;
    };

    this.putBrick = function (brick, callback) {
        putBrick(brick, callback, true);
    };

    function putBrick(brick, callback, isSerial){
        let callbackSent = false;

        let handler = function (err, data, headers) {
            if (!isConnectionError(err)) {
                if (callbackSent) {
                    if (err) {
                        callback(err);
                    }
                } else {
                    callback(err, data, headers)
                }
            }
        };
        let url = getStorageUrlAddress();

        putBrickQueue.addBrickRequest(url + "/EDFS/" + brick.getHash(),
            brick.getTransformedData(),
            handler);

        if (isSerial && putBrickQueue.getQueueFreeSlots() > 0) {
            callbackSent = true;
            callback();
        }
    }


    this.getBrick = function (brickHash, callback) {

        let brickRequest = {brickHash: brickHash, callback: callback, data: null};
        bricksQueue.push(brickRequest);

        let url = getStorageUrlAddress();
        getBrickQueue.addBrickRequest(url + "/EDFS/" + brickHash, (err, brickData) => {
            brickRequest.data = {err: err, brickData: brickData};
            handleBricksOrder();
        });
    };

    this.deleteBrick = function (brickHash, callback) {
        throw new Error("Not implemented");
    };

    this.putBarMap = function (barMap, callback) {
        map = barMap;
        const mapBrick = barMap.toBrick();
        mapBrick.setTransformParameters(barMap.getTransformParameters());
        putBrick(mapBrick, (err, res) => {
            callback(err, mapBrick.getHash());
        });
    };

    this.getBarMap = function (mapDigest, callback) {
        if (typeof mapDigest === "function") {
            callback = mapDigest;
            mapDigest = undefined;
        }

        if (map) {
            return callback(undefined, map);
        }

        if (typeof mapDigest === "undefined") {
            return callback(undefined, new bar.FolderBarMap());
        }

        this.getBrick(mapDigest, (err, mapBrick) => {
            if (err) {
                return callback(err);
            }

            map = new bar.FolderBarMap(mapBrick);
            callback(undefined, map);
        });
    };

    //------------------------------------------ internal methods ---------------------------------------------------
    function getStorageUrlAddress() {
        urlIndex++;
        if (urlIndex >= urls.length) {
            urlIndex = 0;
        }
        return urls[urlIndex];
    }

    function isConnectionError(err) {
        if (err && err.code === "ECONNREFUSED") {
            console.error("EDFS Server is unavailable! Try again later!");
            return true;
        }
        return false;
    }

    function handleBricksOrder() {
        let brickRequest = bricksQueue[0];
        if (brickRequest && brickRequest.data) {
            let data = brickRequest.data;
            if (!isConnectionError(data.err)) {
                const brick = new Brick();
                brick.setTransformedData(data.brickData);
                brickRequest.callback(data.err, brick);
                bricksQueue.shift();
                handleBricksOrder();
            }

        }
    }
}

module.exports = {
    createEDFSBrickStorage(url) {
        return new EDFSBrickStorage(url);
    }
};

