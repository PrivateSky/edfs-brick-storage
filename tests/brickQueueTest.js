require("../../../psknode/bundles/pskruntime");
require("../../../psknode/bundles/virtualMQ");
require("../../../psknode/bundles/edfsBar");

const bar = require("bar");
const Brick = bar.Brick;

let EDFSQueueTest = require("./mock/EDFSQueueTest").EDFSQueueTest;
let queueTest = EDFSQueueTest("http://localhost:10000");

let brick = new Brick(Buffer.from("abcdefghi"));

queueTest.putBrick(brick,function(){
    console.log("GATA");
})

queueTest.getBrick(brick.getHash(),function(data){
    console.log("Data",data);
})