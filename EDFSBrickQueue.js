const MAX_QUE_SUPPORTED = 100;

function EDFSBrickQueue(queueLimit) {

    if (!Number.isInteger(queueLimit) || queueLimit > MAX_QUE_SUPPORTED) {
        throw new Error("Que limit should be a number greater than 0 and lower than " + MAX_QUE_SUPPORTED);
    }

    let bricksQueue = [];
    let rateLimit = queueLimit;

    function executeQueue() {
        let item = bricksQueue.pop();
        $$.remote.doHttpPost(item.url, item.brickData, (err, data, headers) => {

                if (err) {
                    if (err.statusCode === 429) {
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

                    if (item.hasOwnProperty("callback")) {
                        let callback = item.callback;
                        callback(null, data, headers);
                    }
                }
            }
        );
    };

    this.addBrickInQueue = function (brickRequest, callback) {
        console.log(bricksQueue.length);

        let queueData = {
            url: brickRequest.url,
            brickData: brickRequest.brickData
        };

        if (bricksQueue.length === rateLimit) {
            queueData ['callback'] = callback;
        } else {
            callback();
        }

        bricksQueue.push(queueData);
        executeQueue();
    }
}

module.exports.EDFSBrickQueue = EDFSBrickQueue;