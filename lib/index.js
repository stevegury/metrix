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
        createDefault: function(recorder, name, initialValue, tags) {
            return new DefaultCounter(recorder, name, initialValue, tags);
        },
        createDisable: function() {
            return new DisableCounter();
        },
        createPrecise: function(recorder, name, initialValue, tags) {
            return new PreciseCounter(recorder, name, initialValue, tags);
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
        createDefault: function(recorder, name, tags) {
            return new DefaultTimer(recorder, name, tags);
        },
        createDisable: function() {
            return new DisableTimer();
        },
        createNoTags: function(recorder, name, tags) {
            return new NoTagTimer(recorder, name, tags);
        }
    },

    createRecorder: function(config) {
        return new Recorder(config);
    },
    createAggregator: function(recorder, config) {
        return new Aggregator(recorder, config);
    }
};
