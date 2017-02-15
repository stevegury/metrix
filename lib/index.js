'use strict';

const Aggregator = require('./aggregator.js');
const Recorder = require('./recorder.js');

const BucketedHistogram = require('./stats/bucketedhistogram.js');
const StreamingHistogram = require('./stats/streaminghistogram.js');

const DefaultCounter = require('./counter/counter.js');
const DisableCounter = require('./counter/disable.js');
const PreciseCounter = require('./counter/precise.js');

const DefaultTimer = require('./timer/timer.js');
const DisableTimer = require('./timer/disable.js');
const NoTagTimer = require('./timer/notagtimer.js');

const defaultConfig = require('./config/default.js');
const disableConfig = require('./config/disable.js');
const disableRecorder = new Recorder(disableConfig.recorder);

module.exports = {
    config: {
        DISABLE: disableConfig,
        DEFAULT: defaultConfig
    },
    recorder: {
        DISABLE: disableRecorder
    },
    counter: {
        createDefault: function(opts) {
            return new DefaultCounter(opts);
        },
        createDisable: function() {
            return new DisableCounter();
        },
        createPrecise: function(opts) {
            return new PreciseCounter(opts);
        }
    },
    histogram: {
        createBucketHistogram: function(opts) {
            return new BucketedHistogram(opts);
        },
        createStreamingHistogram: function(opts) {
            return new StreamingHistogram(opts);
        }
    },
    timer: {
        createDefault: function(opts) {
            return new DefaultTimer(opts);
        },
        createDisable: function() {
            return new DisableTimer();
        },
        createNoTags: function(opts) {
            return new NoTagTimer(opts);
        }
    },

    createRecorder: function(config) {
        return new Recorder(config);
    },
    createAggregator: function(recorder, config) {
        return new Aggregator(recorder, config);
    }
};
