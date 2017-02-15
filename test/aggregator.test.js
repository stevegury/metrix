'use strict';

const assert = require('chai').assert;
const expect = require('chai').expect;
const _ = require('lodash');

const Aggregator = require('../lib/aggregator.js');
const BucketedHistogram = require('../lib/stats/bucketedhistogram.js');
const getRandomInt = require('../lib/common/getRandomInt.js');
const getSemaphore = require('../lib/common/getSemaphore.js');
const Recorder = require('../lib/recorder.js');

describe('Aggregator', function() {
    it('works', function(done) {
        const recorder = new Recorder();
        const aggregator = new Aggregator(recorder);

        function finish() {
            const report = aggregator.report();

            assert.equal(report.counters.counter, 3);
            assert.equal(report.counters['connections/add'], 17);
            assert.equal(report.counters['connections/remove'], 2);

            expect(report.histograms.request_latency.min).to.be.within(0, 10);
            expect(report.histograms.request_latency.max).to.be.within(40, 100);
            expect(report.histograms.request_latency.p50).to.be.within(15, 35);
            expect(report.histograms.request_latency.p90).to.be.within(30, 55);
            expect(report.histograms.request_latency.p99).to.be.within(45, 100);

            const connectLatency =
                report.histograms['connections/connect_latency'];
            expect(connectLatency.min).to.be.within(0, 10);
            expect(connectLatency.max).to.be.within(40, 100);
            expect(connectLatency.p50).to.be.within(15, 35);
            expect(connectLatency.p90).to.be.within(30, 55);
            expect(connectLatency.p99).to.be.within(45, 100);

            done();
        }

        recorder.counter('counter', 3);
        const connections = recorder.scope('connections');
        connections.counter('add', 17);
        connections.counter('remove', 2);

        const n = 1 << 8;
        const semaphore = getSemaphore(n, finish);
        const requestLatency = recorder.timer('request_latency');

        for (let i = 0; i < n / 2; i++) {
            const id = requestLatency.start();
            setTimeout(function() {
                requestLatency.stop(id);
                semaphore.latch();
            }, getRandomInt(0, 50));
        }
        const connectionLatency = connections.timer('connect_latency');

        for (let j = 0; j < n / 2; j++) {
            const id2 = connectionLatency.start();
            setTimeout(function() {
                connectionLatency.stop(id2);
                semaphore.latch();
            }, getRandomInt(0, 50));
        }
    });

    it('tag timer works', function() {
        const recorder = new Recorder();
        const aggregator = new Aggregator(recorder, {
            timer: function(event, histograms, counters) {
                const duration = event.stopTs - event.startTs;

                if (!histograms[event.name]) {
                    histograms[event.name] = new BucketedHistogram();
                }
                histograms[event.name].add(duration);

                if (event.url) {
                    const name = event.url + '/' + event.name;

                    if (!histograms[name]) {
                        histograms[name] = new BucketedHistogram();
                    }
                    histograms[name].add(duration);
                }
            }
        });
        const timer = recorder.timer('request_latency_ms');

        _.forEach(['home', 'edit', 'explore'], function(url) {
            for (let i = 0; i < 100; i++) {
                const id = timer.start();
                timer.stop(id, { url: url });
            }
        });

        const report = aggregator.report();
        assert(report.histograms.request_latency_ms);
        assert(report.histograms['home/request_latency_ms']);
        assert(report.histograms['edit/request_latency_ms']);
        assert(report.histograms['explore/request_latency_ms']);
    });

    it('create composite counters', function() {
        const recorder = new Recorder();
        const aggregator = new Aggregator(recorder, {
            composites: [
                function(counters, histograms) {
                    const current = counters['connections/add'] -
                        counters['connections/remove'];
                    return ['connections/current', current];
                },
                function(counters, histograms) {
                    const a = counters.a;
                    const b = counters.b;
                    const c = counters.c;
                    return ['d', a + b + c, 'e', a * b * c];
                }
            ]
        });

        const rec = recorder.scope('connections');
        const add = rec.counter('add');
        const remove = rec.counter('remove');
        add.incr();
        add.incr();
        add.incr();
        remove.incr();
        remove.incr();

        recorder.counter('a', 10);
        recorder.counter('b', 30);
        recorder.counter('c', 5);

        const report = aggregator.report();
        assert.equal(report.counters['connections/current'], 1);
        assert.equal(report.counters.d, 45);
        assert.equal(report.counters.e, 1500);
    });
});
