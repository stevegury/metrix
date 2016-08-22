'use strict';

var assert = require('chai').assert;

var DefaultCounter = require('../lib/counter/counter.js');
var NullCounter = require('../lib/counter/disable.js');
var Recorder = require('../lib/recorder.js');

describe('precise counter events', function () {
    it('create/update', function () {
        var recorder = new Recorder();
        var name = 'connections';

        var expectations = [8, 11, 12, 7, 6, 5];
        recorder.on('counter', function (event) {
            assert(event.name === name);
            var expected = expectations.pop();
            assert(event.value === expected);
        });

        var connectionCounter = recorder.counter(name, 5);
        connectionCounter.incr();
        connectionCounter.incr();
        connectionCounter.incr(5);
        connectionCounter.decr();
        connectionCounter.decr(3);
    });

    it('disabled recorder doesn\'t generate events', function (done) {
        var recorder = new Recorder({
            counter: function (_recorder, name, tags) {
                if (name !== 'forbiddenEvent') {
                    return new DefaultCounter(_recorder, name, tags);
                } else {
                    return NullCounter;
                }
            }
        });

        var eventReceived = false;
        recorder.on('counter', function (event) {
            eventReceived = true;
            assert(event.name === 'okEvent');
            done();
        });

        recorder.counter('forbiddenEvent', 1);
        assert(!eventReceived, 'No event should have been received!');
        recorder.counter('okEvent', 1);
    });

    it('scope counter works', function () {
        var rootRecorder = new Recorder();
        var sep = rootRecorder._separator;
        var scope1 = 'foo';
        var scope2 = 'bar';
        var name = 'my_counter';

        rootRecorder.on('counter', function (event) {
            assert(event.name === scope1 + sep + scope2 + sep + name);
        });

        var scopedRecorder = rootRecorder.scope(scope1).scope(scope2);
        var counter = scopedRecorder.counter(name, 5);
        counter.incr();
    });

    it('tags works', function () {
        var recorder = new Recorder();
        var tags = {tag0: 'test'};

        recorder.on('counter', function (event) {
            assert(event.name === 'toto');
            assert.deepEqual(event.tags, tags);
        });

        var c = recorder.counter('toto', 5, tags);
        c.incr();
    });
});
