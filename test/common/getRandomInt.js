'use strict';

module.exports = function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};
