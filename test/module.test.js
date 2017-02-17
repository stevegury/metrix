'use strict';

const assert = require('chai').assert;
const _ = require('lodash');

const metrix = require('..');
const customConfig = require('../lib/config/custom');

/**
 * This unit test only test the module API, (i.e. the creation of object)
 * not the underlying behavior (which is done in individual tests).
 */
describe('Module API', function() {
    const configs = {
        NONE: null,
        DEFAULT: metrix.config.DEFAULT,
        DISABLE: metrix.config.DISABLE,
        CUSTOM: customConfig
    };

    _.forEach(configs, (config, name) => {
        it('createRecorder()/createAggregator() '
            + 'with config: ' + name, function() {
                let recorder;

                if (config) {
                    recorder = metrix.createRecorder(config.recorder);
                } else {
                    recorder = metrix.createRecorder();
                }
                assert.isTrue(recorder !== null);

                let aggregator;

                if (config) {
                    aggregator = metrix.createAggregator(
                        recorder, config.aggregator);
                } else {
                    aggregator = metrix.createAggregator(recorder);
                }
                assert.isTrue(aggregator !== null);
            });
    });

    function testCounter(counter) {
        assert.isTrue(counter !== null);

        // This shouldn't throw
        counter.incr();
        counter.incr(12);
    }

    it('Creating default Counter', function() {
        const recorder = metrix.createRecorder();
        const counter = metrix.counter.createDefault(recorder, 'name', 1, {
            tag1: 'data'
        });
        testCounter(counter);
    });

    it('Creating precise Counter', function() {
        const recorder = metrix.createRecorder();
        const counter = metrix.counter.createPrecise(recorder, 'name', 1, {
            tag1: 'data'
        });
        testCounter(counter);
    });

    it('Creating disable Counter', function() {
        const recorder = metrix.createRecorder();
        const counter = metrix.counter.createDisable(recorder, 'name', 1, {
            tag1: 'data'
        });
        testCounter(counter);
    });


    function testTimer(timer) {
        assert.isTrue(timer !== null);

        // This shouldn't throw
        const id = timer.start();
        timer.stop(id);
    }

    it('Creating default Timer', function() {
        const recorder = metrix.createRecorder();
        const timer = metrix.timer.createDefault(recorder, 'name', {
            tag1: 'data'
        });
        testTimer(timer);
    });

    it('Creating notags Timer', function() {
        const recorder = metrix.createRecorder();
        const timer = metrix.timer.createNoTags(recorder, 'name', {
            tag1: 'data'
        });
        testTimer(timer);
    });

    it('Creating disable Timer', function() {
        const recorder = metrix.createRecorder();
        const timer = metrix.timer.createDisable(recorder, 'name', {
            tag1: 'data'
        });
        testTimer(timer);
    });

    function testHisto(histo) {
        assert.isTrue(histo !== null);
        histo.add(0);
        histo.add(10);
        histo.add(100);
        const snapshot = histo.snapshot();
        assert.isTrue(snapshot !== null);
    }

    it('Creating Bucket Histogram', function() {
        const histo = metrix.histogram.createBucketHistogram({
            quantiles: [0.5, 0.9],
            error: 0.01,
            max: 1000
        });

        testHisto(histo);
    });

    it('Creating Streaming Histogram', function() {
        const histo = metrix.histogram.createStreamingHistogram({
            quantiles: [0.5, 0.9],
            error: 0.01,
            max: 1000
        });

        testHisto(histo);
    });
});
