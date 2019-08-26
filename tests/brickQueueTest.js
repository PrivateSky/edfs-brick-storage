require("../../../psknode/bundles/pskruntime");
require("../../../psknode/bundles/virtualMQ");
require("../../../psknode/bundles/edfsBar");
const assert = require("double-check").assert;
const bar = require("bar");
const Brick = bar.Brick;
const NR_OF_BRICKS = 100;
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

let requestsFullFilled = 0;


assert.callback("PutBrick", (callback) => {
    bricks.forEach((brick)=>{
        queueTest.putBrick(brick, function () {
            requestsFullFilled++;
            console.log(requestsFullFilled);
            if(requestsFullFilled >= NR_OF_BRICKS){
                assert.true(requestsFullFilled === NR_OF_BRICKS,"Yep");
                callback();
            }

        })
    });
},10000);



/*queueTest.getBrick(brick.getHash(), function (data) {
    console.log("Data", data);
})*/
