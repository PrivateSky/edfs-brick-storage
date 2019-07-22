require("psk-http-client");
const bar = require("bar");
const Brick = bar.Brick;

function EDFSBrickStorage(url) {

    this.putBrick = function (brick, callback) {
        $$.remote.doHttpPost(url + "/EDFS/" + brick.getHash(), brick.getData(), callback);
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

module.exports = EDFSBrickStorage;

