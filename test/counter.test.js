'use strict';

const assert = require('chai').assert;

const DefaultCounter = require('../lib/counter/counter.js');
const NullCounter = require('../lib/counter/disable.js');
const Recorder = require('../lib/recorder.js');

describe('precise counter events', function() {
    it('create/update', function() {
        const recorder = new Recorder();
        const name = 'connections';

        const expectations = [-3, -1, 5, 1, 1, 5];
        recorder.on('counter', function(event) {
            assert(event.name === name);
            const expected = expectations.pop();
            assert(event.increment === expected);
        });

        const connectionCounter = recorder.counter(name, 5);
        connectionCounter.incr();
        connectionCounter.incr();
        connectionCounter.incr(5);
        connectionCounter.decr();
        connectionCounter.decr(3);
    });

    it('disabled recorder doesn\'t generate events', function(done) {
        const recorder = new Recorder({
            counter: function(_recorder, name, tags) {
                if (name !== 'forbiddenEvent') {
                    return new DefaultCounter(_recorder, name, tags);
                } else {
                    return NullCounter;
                }
            }
        });

        let eventReceived = false;
        recorder.on('counter', function(event) {
            eventReceived = true;
            assert(event.name === 'okEvent');
            done();
        });

        recorder.counter('forbiddenEvent', 1);
        assert(!eventReceived, 'No event should have been received!');
        recorder.counter('okEvent', 1);
    });

    it('scope counter works', function() {
        const rootRecorder = new Recorder();
        const sep = rootRecorder.separator;
        const scope1 = 'foo';
        const scope2 = 'bar';
        const name = 'my_counter';

        rootRecorder.on('counter', function(event) {
            assert(event.name === scope1 + sep + scope2 + sep + name);
        });

        const scopedRecorder = rootRecorder.scope(scope1).scope(scope2);
        const counter = scopedRecorder.counter(name, 5);
        counter.incr();
    });

    it('tags works', function() {
        const recorder = new Recorder();
        const tags = { tag0: 'test' };

        recorder.on('counter', function(event) {
            assert(event.name === 'toto');
            assert.deepEqual(event.tags, tags);
        });

        const c = recorder.counter('toto', 5, tags);
        c.incr();
    });
});
