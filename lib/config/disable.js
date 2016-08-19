'use strict';

var NullCounter = require('./counter/disable.js');
var NullTimer = require('./timer/disable.js');

/**
 * Disable configuration.
 * Discard all events.
 */
var config = {
    recorder: {
        timer: function (recorder, name, tags) {
            return NullTimer();
        },
        counter: function (recorder, name, value, tags) {
            return NullCounter();
        }
    },
    aggregator: {
        timer: function (event, histograms, counters) {
            return null; // never used
        },
        counter: function (event, histograms, counters) {
            return null; // never used
        },
        composites: null
    }
};

module.exports = config;
