'use strict';

const _ = require('lodash');
const assert = require('chai').assert;

const Aggregator = require('../lib/aggregator.js');
const Recorder = require('../lib/recorder.js');

const disableConfig = require('../lib/config/disable.js');
const defaultConfig = require('../lib/config/default.js');
const preciseConfig = require('../lib/config/precise.js');
const customConfig = require('../lib/config/custom.js');

describe('Configuration', function() {
    it('disable config doesn\'t generate events', function() {
        const disableRecorder = new Recorder(disableConfig.recorder);
        const aggregator = new Aggregator(disableRecorder, {
            counter: function(event, histograms, counters) {
                assert(false, 'I shouldn\'t receive an event');
            },
            timer: function(event, histograms, counters) {
                assert(false, 'I shouldn\'t receive an event');
            }
        });
        disableRecorder.counter('counter', 1);
        const timer = disableRecorder.timer('timer');
        timer.start();
        timer.stop();

        assert.deepEqual(aggregator.report(), { counters: {}, histograms: {}});
    });

    const configs = {
        'DEFAULT': defaultConfig,
        'PRECISE': preciseConfig,
        'CUSTOM': customConfig
    }

    _.forEach(configs, (config, configName) => {
        it('Config "' + configName + '" works', function () {
            const recorder = new Recorder(defaultConfig.recorder);
            const aggregator = new Aggregator(recorder, defaultConfig.aggregator);
            recorder.counter('counter', 1);

            const timer = recorder.timer('timer');
            const id = timer.start();
            timer.stop(id);

            const histo = recorder.histogram('histo');
            histo.add(123);
            histo.add(456);

            const report = aggregator.report();
            assert.equal(report.counters.counter, 1);
            assert(report.histograms.timer);
            assert(report.histograms.histo);

            _.forEach(report.histograms, histogram => {
                assert(histogram);
                assert(histogram.min >= 0);
                assert(histogram.max >= 0);
                assert(histogram.p50 >= 0);
                assert(histogram.p90 >= 0);
                assert(histogram.p99 >= 0);
            });
        });
    });
});
