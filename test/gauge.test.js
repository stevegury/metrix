'use strict';

const assert = require('chai').assert;

const DefaultGauge = require('../lib/gauge/default.js');
const NullGauge = require('../lib/gauge/disable.js');
const Recorder = require('../lib/recorder.js');

describe('Gauge', function() {
    it('create/update', function() {
        const recorder = new Recorder();
        const name = 'connections';

        const valueExpectations = [10, 10, 15, 17, 10, 5];
        recorder.on('gauge', function(event) {
            const expectedValue = valueExpectations.pop();
            assert.equal(event.value, expectedValue);
        });

        const gauge = recorder.gauge(name, 5);
        gauge.update(10);
        gauge.update(17);
        gauge.update(15);
        gauge.update(10);
        gauge.update(10);
    });

    it('create/update precise gauge', function() {
        const recorder = new Recorder();
        const name = 'connections';

        const valueExpectations = [10, 10, 15, 17, 10, 5];
        recorder.on('gauge', function(event) {
            const expectedValue = valueExpectations.pop();
            assert.equal(event.value, expectedValue);
        });

        // precise gauges also generate histograms of values
        recorder.on('histogram', function(event) {
            assert.equals(event.name, name + recorder.separator + 'histogram');
            const expectedValue = valueExpectations.pop();
            assert.equal(event.value, expectedValue);
        });

        const gauge = recorder.gauge(name, 5);
        gauge.update(10);
        gauge.update(17);
        gauge.update(15);
        gauge.update(10);
        gauge.update(10);
    });

    it('disabled recorder doesn\'t generate events', function(done) {
        const recorder = new Recorder({
            gauge: function(_recorder, name, tags) {
                if (name.startsWith('forbiddenEvent')) {
                    return NullGauge;
                } else {
                    return new DefaultGauge(_recorder, name, tags);
                }
            }
        });

        let eventReceived = false;
        recorder.on('gauge', function(event) {
            eventReceived = true;
            assert(event.name.startsWith('okEvent'));
            done();
        });

        recorder.gauge('forbiddenEvent', 1);
        assert(!eventReceived, 'No event should have been received!');
        recorder.gauge('okEvent', 1);
    });

    it('scope gauge works', function() {
        const rootRecorder = new Recorder();
        const sep = rootRecorder.separator;
        const scope1 = 'foo';
        const scope2 = 'bar';
        const name = 'my_gauge';

        rootRecorder.on('counter', function(event) {
            assert(event.name.startsWith(scope1 + sep + scope2 + sep + name));
        });

        const scopedRecorder = rootRecorder.scope(scope1).scope(scope2);
        const counter = scopedRecorder.counter(name, 5);
        counter.incr();
    });

    it('tags works', function() {
        const recorder = new Recorder();
        const tags = { tag0: 'test' };

        recorder.on('gauge', function(event) {
            assert(event.name.startsWith('toto'));
            assert.deepEqual(event.tags, tags);
        });

        const g = recorder.gauge('toto', 5, tags);
        g.update(2);
    });

    it('tags works with scope', function() {
        const recorder = (new Recorder()).scope('scope1');
        const tags = { tag0: 'test' };

        recorder.on('gauge', function(event) {
            assert(event.name.startsWith(
                'scope1' + recorder.separator + 'toto'));
            assert.deepEqual(event.tags, tags);
        });

        const g = recorder.gauge('toto', 5, tags);
        g.update(12);
    });
});
