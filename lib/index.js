'use strict';

var Recorder = require('./recorder.js');
var Aggregator = require('./aggregator.js');

var disableConfig = require('./config/disable.js');
var defaultConfig = require('./config/default.js');

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
