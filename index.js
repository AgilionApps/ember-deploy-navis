/* jshint node: true */
'use strict';

var NavisAdapter = require('./lib/navis-adapter');

module.exports = {
  name: 'ember-deploy-navis',
  type: 'ember-deploy-addon',

  adapters: {
    index: {
      'Navis': NavisAdapter
    }
  }
};
