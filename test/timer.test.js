'use strict';

const assert = require('chai').assert;

const DefaultTimer = require('../lib/timer/timer.js');
const NullTimer = require('../lib/timer/disable.js');
const Recorder = require('../lib/recorder.js');

describe('Timer', function() {
    it('start/stop generates event', function(done) {
        const recorder = new Recorder();
        const duration = 10;
        const name = 'send-request';

        recorder.on('timer', function(event) {
            assert(event.stopTs - event.startTs >= duration);
            assert(event.name === name);
            done();
        });

        const timer = recorder.timer(name);
        const id = timer.start();
        setTimeout(function() {
            timer.stop(id);
        }, 10);
    });

    it('disabled recorder doesn\'t generate events', function(done) {
        const recorder = new Recorder({
            timer: function(_recorder, name, tags) {
                if (name === 'forbiddenEvent') {
                    return NullTimer;
                } else {
                    return new DefaultTimer(_recorder, name, tags);
                }
            }
        });

        let eventReceived = false;
        recorder.on('timer', function(event) {
            eventReceived = true;
            assert(event.stopTs - event.startTs >= 0);
            assert(event.name === 'okEvent');
            done();
        });

        const timer0 = recorder.timer('forbiddenEvent');
        const id0 = timer0.start();
        timer0.stop(id0);

        assert(!eventReceived, 'No event should have been received!');

        const timer1 = recorder.timer('okEvent');
        const id1 = timer1.start();
        timer1.stop(id1);
    });

    it('scoped timer works', function() {
        const rootRecorder = new Recorder();
        const sep = rootRecorder.separator;
        const scope1 = 'foo';
        const scope2 = 'bar';
        const name = 'my_timer';

        rootRecorder.on('timer', function(event) {
            assert(event.name === scope1 + sep + scope2 + sep + name);
        });

        const scopedRecorder = rootRecorder.scope(scope1).scope(scope2);
        const timer = scopedRecorder.timer(name);
        const id = timer.start();
        timer.stop(id);
    });

    it('tags works', function() {
        const recorder = new Recorder();
        const tags = { tag0: 'test', tag1: 'toto' };

        recorder.on('timer', function(event) {
            assert(event.name === 'toto');
            assert.equal(event.tag0, 'test');
            assert.equal(event.tag1, 'toto');
        });

        const timer = recorder.timer('toto', tags);
        const id = timer.start();
        timer.stop(id);
    });

    it('tags works with scope', function() {
        const recorder = (new Recorder()).scope('scope1');
        const tags = { tag0: 'test', tag1: 'toto' };

        recorder.on('timer', function(event) {
            assert(event.name === 'scope1' + recorder.separator + 'toto');
            assert.equal(event.tag0, 'test');
            assert.equal(event.tag1, 'toto');
        });

        const timer = recorder.timer('toto', tags);
        const id = timer.start();
        timer.stop(id);
    });
});
