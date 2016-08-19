'use strict';

var assert = require('chai').assert;

var DefaultTimer = require('../lib/timer/timer.js');
var NullTimer = require('../lib/timer/disable.js');
var Recorder = require('../lib/recorder.js');

describe('timer events', function () {
    it('start/stop generate event', function (done) {
        var recorder = new Recorder();
        var duration = 10;
        var name = 'send-request';

        recorder.on('timer', function (event) {
            assert(event.stopTs - event.startTs >= duration);
            assert(event.name === name);
            done();
        });

        var timer = recorder.timer(name);
        var id = timer.start();
        setTimeout(function () {
            timer.stop(id);
        }, 10);
    });

    it('disabled recorder doesn\'t generate events', function (done) {
        var recorder = new Recorder({
            timer: function (_recorder, name, tags) {
                if (name === 'forbiddenEvent') {
                    return NullTimer;
                } else {
                    return new DefaultTimer(_recorder, name, tags);
                }
            }
        });

        var eventReceived = false;
        recorder.on('timer', function (event) {
            eventReceived = true;
            assert(event.stopTs - event.startTs >= 0);
            assert(event.name === 'okEvent');
            done();
        });

        var timer0 = recorder.timer('forbiddenEvent');
        var id0 = timer0.start();
        timer0.stop(id0);

        assert(!eventReceived, 'No event should have been received!');

        var timer1 = recorder.timer('okEvent');
        var id1 = timer1.start();
        timer1.stop(id1);
    });

    it('scoped timer works', function () {
        var rootRecorder = new Recorder();
        var sep = rootRecorder._separator;
        var scope1 = 'foo';
        var scope2 = 'bar';
        var name = 'my_timer';

        rootRecorder.on('timer', function (event) {
            assert(event.name === scope1 + sep + scope2 + sep + name);
        });

        var scopedRecorder = rootRecorder.scope(scope1).scope(scope2);
        var timer = scopedRecorder.timer(name);
        var id = timer.start();
        timer.stop(id);
    });

    it('tags works', function () {
        var recorder = new Recorder();
        var tags = {tag0: 'test', tag1: 'toto'};

        recorder.on('timer', function (event) {
            assert(event.name === 'toto');
            assert.equal(event.tag0, 'test');
            assert.equal(event.tag1, 'toto');
        });

        var timer = recorder.timer('toto', tags);
        var id = timer.start();
        timer.stop(id);
    });
});
