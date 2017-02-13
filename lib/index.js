'use strict';

var Aggregator = require('./aggregator.js');
var Recorder = require('./recorder.js');
var disableRecorder = new Recorder(disableConfig.recorder);

var BucketedHistogram = require('./stats/bucketedhistogram.js');
var StreamingHistogram = require('./stats/streaminghistogram.js');

var DefaultCounter = require('./counter/counter.js');
var DisableCounter = require('./counter/disable.js');
var PreciseCounter = require('./counter/precise.js');

var DefaultTimer = require('./timer/timer.js');
var DisableTimer = require('./timer/disable.js');
var NoTagTimer = require('./timer/notagtimer.js');

var defaultConfig = require('./config/default.js');
var disableConfig = require('./config/disable.js');

module.exports = {
    config: {
        DISABLE: disableConfig,
        DEFAULT: defaultConfig
    },
    recorder: {
        DISABLE: disableRecorder
    },
    counter: {
        createDefault: function (opts) {
            return new DefaultCounter(opts);
        },
        createDisable: function () {
            return new DisableCounter();
        },
        createPrecise: function (opts) {
            return new PreciseCounter(opts);
        }
    },
    histogram: {
        createBucketHistogram: function (opts) {
            return new BucketedHistogram(opts);
        },
        createStreamingHistogram: function (opts) {
            return new StreamingHistogram(opts);
        }
    },
    timer: {
        createDefault: function (opts) {
            return new DefaultTimer(opts);
        },
        createDisable: function () {
            return new DisableTimer();
        },
        createNoTags: function (opts) {
            return new NoTagTimer(opts);
        }
    },

    createRecorder: function (config) {
        return new Recorder(config);
    },
    createAggregator: function (recorder, config) {
        return new Aggregator(recorder, config);
    }
};
