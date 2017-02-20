'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;

const BucketedHistogram = require('../lib/stats/bucketedhistogram.js');
const getRandomInt = require('../lib/common/getRandomInt');
const StreamingHistogram =
    require('../lib/stats/streaminghistogram.js');

describe('StreamingHistogram', function() {
    it('empty histogram', function() {
        const h = new StreamingHistogram();
        assert.deepEqual(h.snapshot(), {});
    });

    it('single value histogram', function() {
        const h = new StreamingHistogram();
        h.add(1);
        assert.deepEqual(h.snapshot(), {
            min: 1,
            max: 1,
            p50: 1,
            p90: 1,
            p99: 1
        });
    });

    it('histogram & random data', function() {
        const h = new StreamingHistogram();

        for (let i = 0; i < 10000; i++) {
            h.add(getRandomInt(0, 1000));
        }

        const snap = h.snapshot();
        expect(snap.min).to.be.within(0, 50);
        expect(snap.p50).to.be.within(400, 600);
        expect(snap.p90).to.be.within(850, 950);
        expect(snap.p99).to.be.within(950, 1000);
        expect(snap.max).to.be.within(950, 1000);
    });
});

describe('BucketedHistogram', function() {
    it('empty histogram', function() {
        const h = new BucketedHistogram();
        assert.deepEqual(h.snapshot(), {});
    });

    it('binary search', function() {
        const h = new BucketedHistogram();
        const a = [1, 2, 4, 6, 12, 28, 31];

        assert.equal(0, h._binarySearch(0, a, 0, 6));
        assert.equal(0, h._binarySearch(1, a, 0, 6));
        assert.equal(1, h._binarySearch(2, a, 0, 6));
        assert.equal(2, h._binarySearch(3, a, 0, 6));
        assert.equal(2, h._binarySearch(4, a, 0, 6));
        assert.equal(3, h._binarySearch(5, a, 0, 6));
        assert.equal(3, h._binarySearch(6, a, 0, 6));
        assert.equal(4, h._binarySearch(7, a, 0, 6));
        assert.equal(4, h._binarySearch(8, a, 0, 6));
        assert.equal(4, h._binarySearch(9, a, 0, 6));
        assert.equal(4, h._binarySearch(10, a, 0, 6));
        assert.equal(4, h._binarySearch(11, a, 0, 6));
        assert.equal(4, h._binarySearch(12, a, 0, 6));
        assert.equal(5, h._binarySearch(13, a, 0, 6));
        assert.equal(5, h._binarySearch(27, a, 0, 6));
        assert.equal(5, h._binarySearch(28, a, 0, 6));
        assert.equal(6, h._binarySearch(29, a, 0, 6));
        assert.equal(6, h._binarySearch(30, a, 0, 6));
        assert.equal(6, h._binarySearch(31, a, 0, 6));
    });

    it('single value histogram', function() {
        const h = new BucketedHistogram();
        h.add(1);
        const snap = h.snapshot();
        assert.equal(snap.min, 1);
        assert.equal(snap.max, 1);
        assert.equal(snap.p50, 1);
        assert.equal(snap.p90, 1);
        assert.equal(snap.p99, 1);
    });

    it('double value histogram', function() {
        const h = new BucketedHistogram();
        h.add(1);
        h.add(10);
        const snap = h.snapshot();
        assert.equal(snap.min, 1);
        assert.equal(snap.max, 10);
        assert.equal(snap.p50, 1);
        expect(snap.p90).to.be.within(9, 10);
        expect(snap.p99).to.be.within(9, 10);
    });

    it('histogram & random data', function() {
        const h = new BucketedHistogram();

        for (let i = 0; i < 10000; i++) {
            h.add(getRandomInt(0, 1000));
        }

        const snap = h.snapshot();
        assert.equal(snap.min, 0);
        expect(snap.p50).to.be.within(480, 520);
        expect(snap.p90).to.be.within(880, 920);
        expect(snap.p99).to.be.within(970, 999);
        assert.equal(snap.max, 999);
    });

    it('histogram & deal with overflow', function() {
        const h = new BucketedHistogram({ max: 10 });

        for (let i = 0; i < 10000; i++) {
            h.add(getRandomInt(0, 1000));
        }

        const snap = h.snapshot();
        expect(snap.min).to.be.within(0, 50);
        expect(snap.p50).to.be.within(9, 11);
        expect(snap.p90).to.be.within(9, 11);
        expect(snap.p99).to.be.within(9, 11);
        expect(snap.overflow).to.be.within(9800, 10000);
        expect(snap.max).to.be.within(950, 999);
    });
});
