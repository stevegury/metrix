'use strict';

const NullCounter = {
    incr: function nullInc() {
        return;
    },
    decr: function nullInc() {
        return;
    }
};

module.exports = NullCounter;
