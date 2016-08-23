'use strict';

var assert = require('chai').assert;

var Aggregator = require('../lib/aggregator.js');
var Recorder = require('../lib/recorder.js');

var disableConfig = require('../lib/config/disable.js');
var defaultConfig = require('../lib/config/default.js');

describe('configuration', function () {
    it('disable config doesn\'t generate events', function () {
        var disableRecorder = new Recorder(disableConfig.recorder);
        var aggregator = new Aggregator(disableRecorder, {
            counter: function (event, histograms, counters) {
                assert(false, 'I shouldn\'t receive an event');
            },
            timer: function (event, histograms, counters) {
                assert(false, 'I shouldn\'t receive an event');
            }
        });
        disableRecorder.counter('counter', 1);
        var timer = disableRecorder.timer('timer');
        timer.start();
        timer.stop();

        assert.deepEqual(aggregator.report(), {counters: {}, histograms: {}});
    });

    it('default config works', function () {
        var recorder = new Recorder(defaultConfig.recorder);
        var aggregator = new Aggregator(recorder, defaultConfig.aggregator);
        recorder.counter('counter', 1);
        var timer = recorder.timer('timer');
        var id = timer.start();
        timer.stop(id);

        var report = aggregator.report();
        assert.equal(report.counters.counter, 1);
        assert(report.histograms.timer);
        assert(report.histograms.timer.min >= 0);
        assert(report.histograms.timer.max >= 0);
        assert(report.histograms.timer.p50 >= 0);
        assert(report.histograms.timer.p90 >= 0);
        assert(report.histograms.timer.p99 >= 0);
    });
});
