/* jshint node: true */
'use strict';

var DeployPluginBase = require('ember-cli-deploy-plugin');
var NavisDeploy      = require('./lib/navis-deploy');
var path             = require('path');

module.exports = {
  name: 'ember-cli-deploy-navis',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        deployHost: 'http://api.navis.io',
        assets: true,
        filePattern: 'index.html',
        navisDeploy: function() { return new NavisDeploy(this.pluginConfig); },

        //TODO: Our own revision adapter?
        revisionKey: function(context) {
          return context.commandOptions.revision || 
            (context.revisionData && context.revisionData.revisionKey).split('+')[1];
        }
      },

      requiredConfig: ['appKey', 'userKey', 'userSecret', 'filePattern'],

      upload: function(context) {
        var navis       = this.readConfig('navisDeploy');
        var filePattern = this.readConfig('filePattern');
        var revision    = this.readConfig('revisionKey');
        var filePath    = path.join(context.distDir, filePattern);
        this.log('Uploading `' + filePath + '`' + ' as `' + revision + '`');
        return navis.uploadBuild(filePath, revision);
      },

      activate: function() {
        var navis    = this.readConfig('navisDeploy');
        var revision = this.readConfig('revisionKey');
        this.log('Activating revision `' + revision + '`');
        return navis.activate(revision);
      },

      fetchRevisions: function() {
        var navis = this.readConfig('navisDeploy');
        this.log('Fetching revisions');
        return navis.list().then(function(data) {
          // Format results for ember-cli-deploy
          return {revisions: data.map(function(rev) {
            return {
              revision:  rev.attributes.ref,
              active:    rev.attributes.active,
              timestamp: rev.attributes['built-at'],
              deployer:  rev.attributes['build-by-name']
            };
          })};
        });
      }
    });


    return new DeployPlugin();
  }
};
