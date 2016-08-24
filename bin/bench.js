#!/usr/bin/env node
'use strict';

var _ = require('lodash');

var Aggregator = require('../lib/aggregator.js');
var BucketedHistogram = require('../lib/stats/bucketedhistogram.js');
var getRandomInt = require('../lib/common/getRandomInt.js');
var getSemaphore = require('../lib/common/getSemaphore.js');
var NullCounter = require('../lib/counter/disable.js');
var NullTimer = require('../lib/timer/disable.js');
var Recorder = require('../lib/recorder.js');
var StreamingHistogram = require('../lib/stats/streaminghistogram.js');

function measure(f, iterations, warmUp, tries) {
    var sum = 0;
    var min = Number.MAX_VALUE;
    var max = Number.MIN_VALUE;

    for (var t = 0; t < warmUp + tries; t++) {
        var i = iterations;

        var start = Date.now();

        while (i > 0) {
            f();
            i--;
        }
        var elapsed = Date.now() - start;

        if (t >= warmUp) {
            var d = 1000.0 * elapsed / iterations;
            sum += d;
            min = Math.min(min, d);
            max = Math.max(max, d);
        }
    }
    return [sum / tries, min, max];
}

function time(f, baseline, iterations, warmUp, tries) {
    var results = measure(f, iterations, warmUp, tries);
    var avg = Math.max(0, results[0] - baseline[0]);
    var min = Math.max(0, results[1] - baseline[1]);
    var max = Math.max(0, results[2] - baseline[2]);
    return {
        min: min.toFixed(3),
        avg: avg.toFixed(3),
        max: max.toFixed(3)
    };
}

function shuffle(array) {
    var j, x, i;

    for (i = array.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = array[i - 1];
        array[i - 1] = array[j];
        array[j] = x;
    }
}

function bench(iterations, warmUp, tries) {
    var emptyFunction = function () { };
    var baseline = measure(emptyFunction, iterations, warmUp, tries);

    var result = {
        iterations: iterations,
        warmUp: warmUp,
        tries: tries,
        unit: 'µs'
    };

    var recorder = new Recorder();
    var histogramFactory = function (name) {
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
    var aggregator = new Aggregator(recorder, {
        timer: function (event, histograms, counters) {
            if (!histograms[event.name]) {
                histograms[event.name] = histogramFactory(event.name);
            }

            if (event.startTs) {
                var duration = event.stopTs - event.startTs;
                var histo = histograms[event.name];
                histo.add(duration);
            }
        }
    });

    var disabledRecorder = new Recorder({
        counter: function (_recorder, name, tags) {
            return NullCounter;
        },
        timer: function (_recorder, name, tags) {
            return NullTimer;
        }
    });
    var disabledAggregator = new Aggregator(disabledRecorder);

    var recorder2 = new Recorder();
    var cheapAggregator = new Aggregator(recorder2, {
        timer: function (event, histograms, counters) {
            if (!histograms[event.name]) {
                histograms[event.name] = new StreamingHistogram();
            }

            if (event.startTs) {
                var duration = event.stopTs - event.startTs;
                var histo = histograms[event.name];
                histo.add(duration);
            }
        }
    });

    result['create counter'] = time(function () {
        recorder.counter('toto');
    }, baseline, iterations, warmUp, tries);

    var counter = recorder.counter('cccc');
    result['increment counter'] = time(function () {
        counter.incr();
    }, baseline, iterations, warmUp, tries);

    result['create disabled counter'] = time(function () {
        disabledRecorder.counter('toto');
    }, baseline, iterations, warmUp, tries);

    var counter2 = disabledRecorder.counter('cccc');
    result['increment disabled counter'] = time(function () {
        counter2.incr();
    }, baseline, iterations, warmUp, tries);


    result['create timer (bucket)'] = time(function () {
        recorder.timer('titi');
    }, baseline, iterations, warmUp, tries);

    var timer = recorder.timer('tttt');
    result['start/stop timer (bucket)'] = time(function () {
        var id = timer.start();
        timer.stop(id);
    }, baseline, iterations, warmUp, tries);

    var ttimer = recorder.timer('tag-timer');
    result['start/stop tagged timer (bucket)'] = time(function () {
        var id = ttimer.start({tag0: 'start'});
        ttimer.stop(id, {tag1: 'stop'});
    }, baseline, iterations, warmUp, tries);


    result['create timer (streaming)'] = time(function () {
        recorder2.timer('titi');
    }, baseline, iterations, warmUp, tries);

    var stimer = recorder2.timer('ssss');
    result['start/stop timer (streaming)'] = time(function () {
        var id = stimer.start();
        stimer.stop(id);
    }, baseline, iterations, warmUp, tries);

    var tstimer = recorder2.timer('tag-timer-ssss');
    result['start/stop timer tag (streaming)'] = time(function () {
        var id = tstimer.start({tag0: 'start'});
        tstimer.stop(id, {tag1: 'stop'});
    }, baseline, iterations, warmUp, tries);

    result['create disabled timer'] = time(function () {
        disabledRecorder.timer('titi');
    }, baseline, iterations, warmUp, tries);

    var timer2 = disabledRecorder.timer('tttt');
    result['start/stop disabled timer'] = time(function () {
        var id = timer2.start();
        timer2.stop(id);
    }, baseline, iterations, warmUp, tries);

    var ttimer2 = disabledRecorder.timer('tttt');
    result['start/stop disabled tag timer'] = time(function () {
        var id = ttimer2.start({tag0: 'start'});
        ttimer2.stop(id, {tag1: 'stop'});
    }, baseline, iterations, warmUp, tries);


    iterations /= 200; // expensive work

    var n = 200; // number of metrics
    var m = 5000; // number of data points in the histograms
    var semaphore = getSemaphore(4 * m * n, function () {
        result['aggregator report (bucket histo)'] = time(function () {
            aggregator.report();
        }, baseline, iterations, warmUp, tries);

        result['aggregator report (streaming histo)'] = time(function () {
            cheapAggregator.report();
        }, baseline, iterations, warmUp, tries);

        result['disabled-aggregator report'] = time(function () {
            disabledAggregator.report();
        }, baseline, iterations, warmUp, tries);

        console.log(JSON.stringify(result, null, 2));
    });

    var rsTimer = recorder.scope('rs').timer('rs');
    var timersAndIds = [];
    _.each(_.range(n), function (j) {
        recorder.counter('toto' + j, getRandomInt(0, 1000));
        recorder2.counter('toto' + j, getRandomInt(0, 1000));
        disabledRecorder.counter('toto' + j, getRandomInt(0, 1000));

        var timer0 = recorder.timer('histo' + j);
        var ctimer2 = recorder2.timer('histo' + j);
        var timerd0 = disabledRecorder.timer('histo' + j);
        _.each(_.range(m), function (k) {
            timersAndIds.push({timer: timer0, id: timer0.start()});
            timersAndIds.push({timer: ctimer2, id: ctimer2.start()});
            timersAndIds.push({timer: timerd0, id: timerd0.start()});
            timersAndIds.push({timer: rsTimer, id: rsTimer.start()});
        });
    });

    shuffle(timersAndIds);

    _.each(timersAndIds, function (obj) {
        obj.timer.stop(obj.id);
        semaphore.latch();
    });
}

bench(200 * 1000, 3, 10);
