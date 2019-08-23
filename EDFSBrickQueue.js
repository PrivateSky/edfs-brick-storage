const MAX_QUE_SUPPORTED = 100;
const NETWORK_TIMEOUT = 1000;

function EDFSBrickQueue(action, queueLimit) {

    if (!Number.isInteger(queueLimit) || queueLimit > MAX_QUE_SUPPORTED) {
        throw new Error("Que limit should be a number greater than 0 and lower than " + MAX_QUE_SUPPORTED);
    }

    let bricksQueue = [];
    let rateLimit = queueLimit;

    function executeQueue() {

        if(bricksQueue.length === 0){
            return;
        }

        let item = bricksQueue.pop();
        let {callback, ...requestData} = item;
        action(...Object.values(requestData), (err, data, headers) => {
                if (err) {
                    if (err.statusCode === 429) {
                        console.log("Too many requests!");
                        bricksQueue.push(item);
                        setTimeout(executeQueue, NETWORK_TIMEOUT);
                    } else {
                        callback(err);
                    }
                } else {
                    if (typeof headers !== "undefined" && headers.hasOwnProperty("x-ratelimit-remaining")) {
                        let remainingQuota = Number.parseInt(headers['x-ratelimit-remaining']);

                        if (!isNaN(remainingQuota)) {
                            rateLimit = remainingQuota
                        }

                        if(rateLimit > 0){
                            if(bricksQueue.length>0){
                                executeQueue();
                            }
                        }
                        else{
                            setTimeout(executeQueue, NETWORK_TIMEOUT);
                        }
                    }

                    if (callback) {
                        callback(null, data, headers);
                    }
                }
            }
        );
    }

    this.addBrickRequest = function (url, ...args) {

        let queueData = {
            url: url
        };

        switch (args.length) {
            case 1:
                if (typeof args[0] !== "function") {
                    throw new Error("Invalid brick data.")
                }
                queueData['callback'] = args[0];
                break;
            case 2:
                if (typeof args[0] !== "object") {
                    throw new Error("Invalid brick data.")
                }
                if (typeof args[1] !== "function") {
                    throw new Error("Invalid callback function.")
                }
                queueData['brickData'] = args[0];
                queueData['callback'] = args[1];
                break;
            default:
                throw new Error("Too many arguments.");
        }

        bricksQueue.push(queueData);

        if (rateLimit > 0) {
            rateLimit--;
            executeQueue();
        }
    };

    this.getQueueSize = function () {
        return bricksQueue.length;
    };

    this.getQueueFreeSlots = function () {
        return rateLimit;
    };
}

module.exports = {
    EDFSPutBrickQueue: function (limit) {
        return new EDFSBrickQueue($$.remote.doHttpPost, limit);
    },

    EDFSGetBrickQueue: function (limit) {
        return new EDFSBrickQueue($$.remote.doHttpGet, limit);
    }
};