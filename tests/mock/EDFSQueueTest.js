let PutBrickQueue = require ("../../EDFSBrickQueue.js").EDFSPutBrickQueue;
let GetBrickQueue = require ("../../EDFSBrickQueue.js").EDFSGetBrickQueue;
let httpMockServices = require("./HttpServices");
let bricksQueue = [];
$$.remote = {};
$$.remote.doHttpGet = httpMockServices.doHttpGet;
$$.remote.doHttpPost = httpMockServices.doHttpPost;

function EDFSQueueTest(url) {

    let putBrickQueue = new PutBrickQueue(30);
    let getBrickQueue = new GetBrickQueue(30);
    this.putBrick = function(brick, callback){
        putBrickQueue.addBrickRequest(url + "/EDFS/" + brick.getHash(),
            brick.getData(),
            callback);

        if (putBrickQueue.getQueueFreeSlots() > 0) {
            callback();
        }
    };

    this.getBrick = function(brickHash, callback){
        let brickRequest = {brickHash: brickHash, callback: callback, data:null}
        bricksQueue.push(brickRequest);

        getBrickQueue.addBrickRequest(url + "/EDFS/" + brickHash, (err, brickData) => {
            brickRequest.data = {err:err, brickData:brickData};
            //handleBricksOrder();
        });
    };

}


module.exports = {
    EDFSQueueTest(url) {
        return new EDFSQueueTest(url);
    }
};

