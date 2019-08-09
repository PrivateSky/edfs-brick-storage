require("psk-http-client");
const bar = require("bar");
const Brick = bar.Brick;
let EdfsBrickQueue = require("./EDFSBrickQueue").EDFSBrickQueue;
let brickQueue = new EdfsBrickQueue(30);

function EDFSBrickStorage(url) {

    this.putBrick = function (brick, callback) {

        brickQueue.addBrickInQueue({
            url: url + "/EDFS/" + brick.getHash(),
            brickData: brick.getData()
        }, callback);
    };

    this.getBrick = function (brickHash, callback) {
        $$.remote.doHttpGet(url + "/EDFS/" + brickHash, (err, brickData) => {
            callback(err, new Brick(brickData));
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

