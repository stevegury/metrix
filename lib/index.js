'use strict';

var Recorder = require('recorder');
var Aggregator = require('aggregator');

var disableConfig = require('config/disable');
var defaultConfig = require('config/default');

var disableRecorder = new Recorder(disableConfig);

module.exports = {
    config: {
        DISABLE: disableConfig,
        DEFAULT: defaultConfig
    },
    recorder: {
        DISABLE: disableRecorder
    },
    
    createRecorder: function (config) {
        return new Recorder(config);
    },
    createAggregator: function (recorder, config) {
        return new Aggregator(recorder, config);
    }
};
