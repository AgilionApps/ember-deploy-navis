/* jshint node: true */
'use strict';

var DeployPluginBase = require('ember-cli-deploy-plugin');
var NavisDeploy      = require('./lib/navis-deploy');
var path             = require('path');
var RSVP             = require('rsvp');
var minimatch        = require('minimatch');
var sleep            = require('sleep');

module.exports = {
  name: 'ember-cli-deploy-navis',

  createDeployPlugin: function(options) {
    var DeployPlugin = DeployPluginBase.extend({
      name: options.name,
      defaultConfig: {
        deployHost:   'http://api.navis.io',
        uploadAssets: true,
        filePattern:  'index.html',
        assetPattern: '**/*.{js,css,png,gif,jpg,map,xml,txt,svg,eot,ttf,woff,woff2}',
        navisDeploy: function() { return new NavisDeploy(this.pluginConfig); },

        revisionKey: function(context) {
          return context.commandOptions.revision || context['git-info']['commit'];
        }
      },

      requiredConfig: ['appKey', 'userKey', 'userSecret'],

      upload: function(context) {
        return new RSVP.all([
          this._uploadIndex(context),
          this._uploadAssets(context)
        ]);
      },

      _uploadIndex: function(context) {
        var navis       = this.readConfig('navisDeploy');
        var filePattern = this.readConfig('filePattern');
        var revision    = this.readConfig('revisionKey');
        var filePath    = path.join(context.distDir, filePattern);

        this.log('Uploading `' + filePath + '`' + ' as `' + revision + '`');
        return navis.uploadBuild(filePath, revision, context['git-info']);
      },

      _uploadAssets: function(context) {
        if (!this.readConfig('uploadAssets')) { return RSVP.resolve(); }

        var navis        = this.readConfig('navisDeploy');
        var assetPattern = this.readConfig('assetPattern');
        var revision     = this.readConfig('revisionKey');

        this.log('Uploading assets');
        var promises = context.distFiles.
          filter(minimatch.filter(assetPattern, {matchBase: true})).
          map(function(file) {
            this.log('Uploading asset: ' + file);
            sleep.usleep(500000);
            return navis.uploadAsset(path.join(context.distDir, file), file);
          }.bind(this));

        return new RSVP.all(promises);
      },

      activate: function() {
        var navis    = this.readConfig('navisDeploy');
        var revision = this.readConfig('revisionKey');
        this.log('Activating revision `' + revision + '`');
        return navis.activate(revision);
      },

      fetchRevisions: function() {
        var navis = this.readConfig('navisDeploy');
        this.log('Fetching revisions from Navis');
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
