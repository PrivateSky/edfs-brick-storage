function AnchoringService(endpoint) {
    //ensuring that registry is initialized
    require("./brickTransportStrategies/brickTransportStrategiesRegistry");
    const brickTransportStrategy = $$.brickTransportStrategiesRegistry.get(endpoint);

    this.getAnchors = function (brickId, callback) {
        brickTransportStrategy.getHashForAlias(brickId, callback);
    };

    this.updateAnchor = function (alias, value, lastValue, callback) {
        if (typeof lastValue === 'function') {
            callback = lastValue;
            lastValue = undefined;
        }
        brickTransportStrategy.attachHashToAlias(alias, value, lastValue, callback);
    };
}

module.exports = AnchoringService;

