const MAX_QUE_SUPPORTED = 100;
const SUPPORTED_HTTP_VERBS = ["POST","GET"];

function EDFSBrickQueue(type, queueLimit) {

    if (!Number.isInteger(queueLimit) || queueLimit > MAX_QUE_SUPPORTED) {
        throw new Error("Que limit should be a number greater than 0 and lower than " + MAX_QUE_SUPPORTED);
    }

    if(!SUPPORTED_HTTP_VERBS.includes(type.toUpperCase())){
        throw new Error(type +"is not supported! Supported verbs are " + SUPPORTED_HTTP_VERBS);
    }

    let bricksQueue = [];
    let rateLimit = queueLimit;

    let action = function(){
        throw new Error("Not implemented");
    };

    switch (type.toUpperCase()) {
        case "POST":
            action = $$.remote.doHttpPost;
            this.addQueueRequest = putBrickQueue;
            break;
        case "GET":
            action = $$.remote.doHttpGet;
            this.addQueueRequest = getBrickQueue;
            break;
    }


    function executeQueue() {
        let item = bricksQueue.pop();
        let {callback, ...requestData} = item;
        action(...Object.values(requestData), (err, data, headers) => {

                if (err) {
                    if (err.statusCode === 429) {
                        console.log("Too many requets!");
                        bricksQueue.push(item);
                        setTimeout(executeQueue, 1000);
                    } else {
                        //TODO handle status codes like 500, 404, 503
                        console.log(err);
                    }
                } else {
                    if (typeof headers !== "undefined" && headers.hasOwnProperty("x-ratelimit-remaining")) {
                        let remainingQuota = Number.parseInt(headers['x-ratelimit-remaining']);

                        if (!isNaN(remainingQuota)) {
                            rateLimit = remainingQuota
                        }
                        console.log("RateLimit, ", rateLimit);
                    }

                    if (callback) {
                        callback(null, data, headers);
                    }
                }
            }
        );
    }

    function putBrickQueue(brickRequest, callback) {

        let queueData = {
            url: brickRequest.url,
            brickData: brickRequest.brickData
        };

        if (bricksQueue.length >= rateLimit) {
            queueData ['callback'] = callback;
        } else {
            callback();
        }

        bricksQueue.push(queueData);
        executeQueue();
    }

     function getBrickQueue (url,callback){
        bricksQueue.push({
            url:url,
            callback:callback
        });
         executeQueue();
    }
}

module.exports = {
    EDFSPutBrickQueue: function (limit) {
        return new EDFSBrickQueue("POST", limit);
    },

    EDFSGetBrickQueue: function (limit) {
        return new EDFSBrickQueue("GET", limit);
    }
};