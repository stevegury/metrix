'use strict';

/**
 * @param {Number} count the initial value of the semaphore
 * @param {Object} doneFn the callback to execute when the semaphore reaches 0
 * @returns {Object} The semaphore object, with a `latch` method.
 */
module.exports = function getSemaphore(count, doneFn) {
    return (function () {
        var c = count;
        return {
            latch: function () {
                c--;

                if (c === 0) {
                    doneFn();
                }
            }
        };
    }());
};
