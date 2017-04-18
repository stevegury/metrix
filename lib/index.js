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

const DefaultGauge = require('./gauge/default.js');
const DisableGauge = require('./gauge/disable.js');
const PreciseGauge = require('./gauge/precise.js');

const defaultConfig = require('./config/default.js');
const disableConfig = require('./config/disable.js');
const disableRecorder = new Recorder(disableConfig.recorder);

module.exports = {
    // Config
    config: {
        DISABLE: disableConfig,
        DEFAULT: defaultConfig
    },

    // Recorder related API
    recorder: {
        DISABLE: disableRecorder
    },
    createRecorder: function(config) {
        return new Recorder(config);
    },

    // Aggregator related API
    createAggregator: function(recorder, config) {
        return new Aggregator(recorder, config);
    },

    // Counter related API (mostly useful inside a config)
    counter: {
        createDefault: function(recorder, name, initialValue, tags) {
            return new DefaultCounter(recorder, name, initialValue, tags);
        },
        createDisable: function() {
            return DisableCounter;
        },
        createPrecise: function(recorder, name, initialValue, tags) {
            return new PreciseCounter(recorder, name, initialValue, tags);
        }
    },

    // Histogram related API (mostly useful inside a config)
    histogram: {
        createBucketHistogram: function(opts) {
            return new BucketedHistogram(opts);
        },
        createStreamingHistogram: function(opts) {
            return new StreamingHistogram(opts);
        }
    },

    // Timer related API (mostly useful inside a config)
    timer: {
        createDefault: function(recorder, name, tags) {
            return new DefaultTimer(recorder, name, tags);
        },
        createDisable: function() {
            return DisableTimer;
        },
        createNoTags: function(recorder, name, tags) {
            return new NoTagTimer(recorder, name, tags);
        }
    },

    // Gauge related API (mostly useful inside a config)
    gauge: {
        createDefault: function(recorder, name, tags) {
            return new DefaultGauge(recorder, name, tags);
        },
        createPrecise: function(recorder, name, tags) {
            return new PreciseGauge(recorder, name, tags);
        },
        createDisable: function() {
            return DisableGauge;
        }
    }
};
