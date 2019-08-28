require("../../../psknode/bundles/pskruntime");
require("../../../psknode/bundles/virtualMQ");
require("../../../psknode/bundles/edfsBar");
const assert = require("double-check").assert;
const Brick = require("bar").Brick;
const NR_OF_BRICKS = 100;
const TIMEOUT = 60*1000; //1 minute
let EDFSQueueTest = require("./mock/EDFSQueueTest").EDFSQueueTest;
let queueTest = EDFSQueueTest("http://localhost:10000");

function generateBricks(nr_of_bricks) {
    let bricks = [];

    for (let i = 0; i < nr_of_bricks; i++) {
        let brickText = Math.random().toString(36);
        let brick = new Brick(Buffer.from(brickText));
        bricks.push(brick);
    }
    return bricks;
}

let bricks = generateBricks(NR_OF_BRICKS);
let putRequestsFullFilled = 0;
let getRequestsFullFilled = 0;
let receivedBricks = [];

assert.begin("PutBrick", () => {
}, TIMEOUT);

assert.callback("PutBrick", (callback) => {

    bricks.forEach((brick, index) => {
            queueTest.putBrick(brick, function (err) {

                if(err){
                    console.log("Index error",index);
                    console.log("Error",err);
                }

                putRequestsFullFilled++;

                if (putRequestsFullFilled === NR_OF_BRICKS) {
                    assert.true(putRequestsFullFilled === NR_OF_BRICKS);
                    callback();
                    testGetBrick();
                } else if (putRequestsFullFilled > NR_OF_BRICKS) {
                    assert.true(putRequestsFullFilled === NR_OF_BRICKS, "Received too many callbacks!");
                }
            })

    });
}, TIMEOUT);

let testGetBrick = function(){
    assert.callback("GetBrick", (callback) => {

        bricks.forEach((brick) => {
                queueTest.getBrick(brick.getHash(), function (err, data) {
                    getRequestsFullFilled++;
                    receivedBricks.push(new Brick(brick.getData()));

                    assert.equal(brick.getHash(), data.getHash(),"Brick hashes are not identical");

                    if (getRequestsFullFilled === NR_OF_BRICKS) {
                        assert.true(getRequestsFullFilled === NR_OF_BRICKS);

                        for (let i = 0; i < bricks.length; i++) {
                            assert.true(bricks[i].getData() === receivedBricks[i].getData(), "Brick arrays are not identical");
                        }
                        callback();
                    } else if (getRequestsFullFilled > NR_OF_BRICKS) {
                        assert.true(getRequestsFullFilled === NR_OF_BRICKS, "Received too many callbacks!");
                    }
                })
        });
    }, TIMEOUT);
};




