'use strict';

const assert = require('chai').assert;

const Aggregator = require('../lib/aggregator.js');
const Recorder = require('../lib/recorder.js');

const disableConfig = require('../lib/config/disable.js');
const defaultConfig = require('../lib/config/default.js');

describe('configuration', function() {
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

    it('default config works', function() {
        const recorder = new Recorder(defaultConfig.recorder);
        const aggregator = new Aggregator(recorder, defaultConfig.aggregator);
        recorder.counter('counter', 1);
        const timer = recorder.timer('timer');
        const id = timer.start();
        timer.stop(id);

        const report = aggregator.report();
        assert.equal(report.counters.counter, 1);
        assert(report.histograms.timer);
        assert(report.histograms.timer.min >= 0);
        assert(report.histograms.timer.max >= 0);
        assert(report.histograms.timer.p50 >= 0);
        assert(report.histograms.timer.p90 >= 0);
        assert(report.histograms.timer.p99 >= 0);
    });
});
