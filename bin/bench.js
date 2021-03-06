#!/usr/bin/env node
'use strict';

const _ = require('lodash');

const Aggregator = require('../lib/aggregator.js');
const BucketedHistogram = require('../lib/stats/bucketedhistogram.js');
const getRandomInt = require('../lib/common/getRandomInt.js');
const getSemaphore = require('../lib/common/getSemaphore.js');
const NullCounter = require('../lib/counter/disable.js');
const NullTimer = require('../lib/timer/disable.js');
const Recorder = require('../lib/recorder.js');
const StreamingHistogram = require('../lib/stats/streaminghistogram.js');

function measure(f, iterations, warmUp, tries) {
    let sum = 0;
    let min = Number.MAX_VALUE;
    let max = Number.MIN_VALUE;

    for (let t = 0; t < warmUp + tries; t++) {
        let i = iterations;

        const start = Date.now();

        while (i > 0) {
            f();
            i--;
        }
        const elapsed = Date.now() - start;

        if (t >= warmUp) {
            const d = 1000.0 * elapsed / iterations;
            sum += d;
            min = Math.min(min, d);
            max = Math.max(max, d);
        }
    }
    return [sum / tries, min, max];
}

function time(f, baseline, iterations, warmUp, tries) {
    const results = measure(f, iterations, warmUp, tries);
    const avg = Math.max(0, results[0] - baseline[0]);
    const min = Math.max(0, results[1] - baseline[1]);
    const max = Math.max(0, results[2] - baseline[2]);
    return {
        min: min.toFixed(3),
        avg: avg.toFixed(3),
        max: max.toFixed(3)
    };
}

function shuffle(array) {
    let j, x, i;

    for (i = array.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = array[i - 1];
        array[i - 1] = array[j];
        array[j] = x;
    }
}

function bench(_iterations, warmUp, tries) {
    let iterations = _iterations;
    // eslint-disable-next-line no-empty-function
    const emptyFunction = function() { };
    const baseline = measure(emptyFunction, iterations, warmUp, tries);

    const result = {
        iterations: iterations,
        warmUp: warmUp,
        tries: tries,
        unit: 'µs'
    };

    const recorder = new Recorder();
    const histogramFactory = function(name) {
        if (name.startsWith('rs')) {
            return new BucketedHistogram({
                error: 1 / 100,
                max: 1000,
                quantiles: [0.1, 0.5, 0.75, 0.9, 0.95, 0.99, 0.999, 0.9999]
            });
        } else {
            return new BucketedHistogram();
        }
    };
    const aggregator = new Aggregator(recorder, {
        timer: function(event, histograms, counters) {
            if (!histograms[event.name]) {
                histograms[event.name] = histogramFactory(event.name);
            }

            if (event.startTs) {
                const duration = event.stopTs - event.startTs;
                const histo = histograms[event.name];
                histo.add(duration);
            }
        }
    });

    const disabledRecorder = new Recorder({
        counter: function(_recorder, name, tags) {
            return NullCounter;
        },
        timer: function(_recorder, name, tags) {
            return NullTimer;
        }
    });
    const disabledAggregator = new Aggregator(disabledRecorder);

    const recorder2 = new Recorder();
    const cheapAggregator = new Aggregator(recorder2, {
        timer: function(event, histograms, counters) {
            if (!histograms[event.name]) {
                histograms[event.name] = new StreamingHistogram();
            }

            if (event.startTs) {
                const duration = event.stopTs - event.startTs;
                const histo = histograms[event.name];
                histo.add(duration);
            }
        }
    });

    result['create counter'] = time(function() {
        recorder.counter('toto');
    }, baseline, iterations, warmUp, tries);

    const counter = recorder.counter('cccc');
    result['increment counter'] = time(function() {
        counter.incr();
    }, baseline, iterations, warmUp, tries);

    result['create disabled counter'] = time(function() {
        disabledRecorder.counter('toto');
    }, baseline, iterations, warmUp, tries);

    const counter2 = disabledRecorder.counter('cccc');
    result['increment disabled counter'] = time(function() {
        counter2.incr();
    }, baseline, iterations, warmUp, tries);


    result['create timer (bucket)'] = time(function() {
        recorder.timer('titi');
    }, baseline, iterations, warmUp, tries);

    const timer = recorder.timer('tttt');
    result['start/stop timer (bucket)'] = time(function() {
        const id = timer.start();
        timer.stop(id);
    }, baseline, iterations, warmUp, tries);

    const ttimer = recorder.timer('tag-timer');
    result['start/stop tagged timer (bucket)'] = time(function() {
        const id = ttimer.start({ tag0: 'start' });
        ttimer.stop(id, { tag1: 'stop' });
    }, baseline, iterations, warmUp, tries);


    result['create timer (streaming)'] = time(function() {
        recorder2.timer('titi');
    }, baseline, iterations, warmUp, tries);

    const stimer = recorder2.timer('ssss');
    result['start/stop timer (streaming)'] = time(function() {
        const id = stimer.start();
        stimer.stop(id);
    }, baseline, iterations, warmUp, tries);

    const tstimer = recorder2.timer('tag-timer-ssss');
    result['start/stop timer tag (streaming)'] = time(function() {
        const id = tstimer.start({ tag0: 'start' });
        tstimer.stop(id, { tag1: 'stop' });
    }, baseline, iterations, warmUp, tries);

    result['create disabled timer'] = time(function() {
        disabledRecorder.timer('titi');
    }, baseline, iterations, warmUp, tries);

    const timer2 = disabledRecorder.timer('tttt');
    result['start/stop disabled timer'] = time(function() {
        const id = timer2.start();
        timer2.stop(id);
    }, baseline, iterations, warmUp, tries);

    const ttimer2 = disabledRecorder.timer('tttt');
    result['start/stop disabled tag timer'] = time(function() {
        const id = ttimer2.start({ tag0: 'start' });
        ttimer2.stop(id, { tag1: 'stop' });
    }, baseline, iterations, warmUp, tries);

    iterations /= 200; // expensive work

    const n = 200; // number of metrics
    const m = 5000; // number of data points in the histograms
    const semaphore = getSemaphore(4 * m * n, function() {
        result['aggregator report (bucket histo)'] = time(function() {
            aggregator.report();
        }, baseline, iterations, warmUp, tries);

        result['aggregator report (streaming histo)'] = time(function() {
            cheapAggregator.report();
        }, baseline, iterations, warmUp, tries);

        result['disabled-aggregator report'] = time(function() {
            disabledAggregator.report();
        }, baseline, iterations, warmUp, tries);

        // eslint-disable-next-line no-console
        console.log(JSON.stringify(result, null, 2));
    });

    const rsTimer = recorder.scope('rs').timer('rs');
    const timersAndIds = [];
    _.each(_.range(n), function(j) {
        recorder.counter('toto' + j, getRandomInt(0, 1000));
        recorder2.counter('toto' + j, getRandomInt(0, 1000));
        disabledRecorder.counter('toto' + j, getRandomInt(0, 1000));

        const timer0 = recorder.timer('histo' + j);
        const ctimer2 = recorder2.timer('histo' + j);
        const timerd0 = disabledRecorder.timer('histo' + j);
        _.each(_.range(m), function(k) {
            timersAndIds.push({ timer: timer0, id: timer0.start()});
            timersAndIds.push({ timer: ctimer2, id: ctimer2.start()});
            timersAndIds.push({ timer: timerd0, id: timerd0.start()});
            timersAndIds.push({ timer: rsTimer, id: rsTimer.start()});
        });
    });

    shuffle(timersAndIds);

    _.each(timersAndIds, function(obj) {
        obj.timer.stop(obj.id);
        semaphore.latch();
    });
}

bench(200 * 1000, 3, 10);
