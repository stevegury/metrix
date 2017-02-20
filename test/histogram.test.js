'use strict';

const assert = require('chai').assert;

const DefaultHistogram = require('../lib/histogram/default.js');
const NullHistogram = require('../lib/histogram/disable.js');
const Recorder = require('../lib/recorder.js');

describe('Histogram', function() {
    it('create/update', function() {
        const recorder = new Recorder();
        const name = 'data';

        const expectations = [100, 10, 1];
        recorder.on('histogram', function(event) {
            assert(event.name === name);
            const expected = expectations.pop();
            assert(event.value === expected);
        });

        const histo = recorder.histogram(name);
        histo.add(1);
        histo.add(10);
        histo.add(100);
    });

    it('disabled histogram doesn\'t generate events', function(done) {
        const recorder = new Recorder({
            histogram: function(_recorder, name, tags) {
                if (name !== 'forbiddenHisto') {
                    return new DefaultHistogram(_recorder, name, tags);
                } else {
                    return NullHistogram;
                }
            }
        });

        let eventReceived = false;
        recorder.on('histogram', function(event) {
            eventReceived = true;
            assert(event.name === 'okHisto');
            done();
        });

        const histo = recorder.histogram('forbiddenHisto');
        histo.add(1);
        assert(!eventReceived, 'No event should have been received!');
        const histo2 = recorder.histogram('okHisto');
        histo2.add(1);
    });

    it('scope histogram works', function() {
        const rootRecorder = new Recorder();
        const sep = rootRecorder.separator;
        const scope1 = 'foo';
        const scope2 = 'bar';
        const name = 'my_histo';

        rootRecorder.on('histogram', function(event) {
            assert(event.name === scope1 + sep + scope2 + sep + name);
        });

        const scopedRecorder = rootRecorder.scope(scope1).scope(scope2);
        const histo = scopedRecorder.histogram(name);
        histo.add(1);
    });

    it('tags works', function() {
        const recorder = new Recorder();
        const tags = { tag0: 'test' };

        recorder.on('histogram', function(event) {
            assert(event.name === 'toto');
            assert.deepEqual(event.tags, tags);
        });

        const histo = recorder.histogram('toto', tags);
        histo.add(1);
    });

    it('tags works with scope', function() {
        const recorder = (new Recorder()).scope('scope1');
        const tags = { tag0: 'test' };

        recorder.on('histogram', function(event) {
            assert(event.name === 'scope1' + recorder.separator + 'toto');
            assert.deepEqual(event.tags, tags);
        });

        const histo = recorder.histogram('toto', tags);
        histo.add(1);
    });
});
