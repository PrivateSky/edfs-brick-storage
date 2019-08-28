let PutBrickQueue = require ("../../EDFSBrickQueue.js").EDFSPutBrickQueue;
let GetBrickQueue = require ("../../EDFSBrickQueue.js").EDFSGetBrickQueue;
const Brick = require("bar").Brick;
let httpMockServices = require("./HttpServices");
let bricksQueue = [];
$$.remote = {};
$$.remote.doHttpGet = httpMockServices.doHttpGet;
$$.remote.doHttpPost = httpMockServices.doHttpPost;

function EDFSQueueTest(url) {

    let putBrickQueue = new PutBrickQueue(1);
    let getBrickQueue = new GetBrickQueue(1);

    this.putBrick = function (brick, callback) {

        let args = [url + "/EDFS/" + brick.getHash(),
            brick.getData()];


        if (putBrickQueue.getQueueFreeSlots() > 0) {
            callback(null);

            //send another error callback only if request fails
            let errorCallback = function (err) {
                if (err) {
                    callback(err);
                }
            };
            args.push(errorCallback);
        } else {
            args.push(callback);
        }
        putBrickQueue.addBrickRequest(...args);
    };


    function handleBricksOrder() {

        /*let mapper = bricksQueue.map((brickRequest)=>{
            return brickRequest.data?1:0;
        });
        console.log(mapper);*/

        let brickRequest = bricksQueue[0];
        if (brickRequest && brickRequest.data) {
            let data = brickRequest.data;
            brickRequest.callback(data.err, new Brick(data.brickData));
            bricksQueue.shift();
            handleBricksOrder();
        }
    }

    this.getBrick = function(brickHash, callback){
        let brickRequest = {brickHash: brickHash, callback: callback, data:null};
        bricksQueue.push(brickRequest);
        setTimeout(()=>{
            getBrickQueue.addBrickRequest(url + "/EDFS/" + brickHash, (err, brickData) => {
                brickRequest.data = {err:err, brickData:brickData};
                handleBricksOrder();
            });
        },parseInt(Math.random()*1000));


    };

}


module.exports = {
    EDFSQueueTest(url) {
        return new EDFSQueueTest(url);
    }
};

