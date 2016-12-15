'use strict';

var Recorder = require('./recorder.js');
var Aggregator = require('./aggregator.js');
var BucketedHistogram = require('./stats/bucketedhistogram.js');
var StreamingHistogram = require('./stats/streaminghistogram.js');

var disableConfig = require('./config/disable.js');
var defaultConfig = require('./config/default.js');

var disableRecorder = new Recorder(disableConfig.recorder);

module.exports = {
    config: {
        DISABLE: disableConfig,
        DEFAULT: defaultConfig
    },
    recorder: {
        DISABLE: disableRecorder
    },
    histogram: {
        createBucketHistogram: function (opts) {
            return new BucketedHistogram(opts);
        },
        createStreamingHistogram: function (opts) {
            return new StreamingHistogram(opts);
        }
    },

    createRecorder: function (config) {
        return new Recorder(config);
    },
    createAggregator: function (recorder, config) {
        return new Aggregator(recorder, config);
    }
};
