'use strict';

var CoreObject = require('core-object');
var Promise = require('ember-cli/lib/ext/promise');
var SilentError = require('ember-cli/lib/errors/silent');
var chalk = require('chalk');
var jwt = require('jwt-simple');
var request = require('superagent');

var green = chalk.green;
var white = chalk.white;

module.exports = CoreObject.extend({
  init: function() {
    CoreObject.prototype.init.apply(this, arguments);

    if (!this.config) {
      throw new SilentError('You must supply a config in deploy.js');
    }

    this.indexPrefix = this.config.prefix || '';

    var host = this.config.host || 'http://api.navis.io';
    var port = this.config.port ? ':' + this.config.port : '';

    this.deployUrl = host + port + '/deploy';
  },

  /**
   * Public methods
   *
   * `upload`, `activate`, `list` methods are expected by ember-deploy for
   * index adapters.
   */

  /**
   * Post current state to navis api
   *
   * ember deploy
   */
  upload: function(buffer) {
    /**
     * `taggingAdapter` is a method from ember-deploy that creates a SHA for
     * tagging revisions.
     */
    var key = this.taggingAdapter.createTag();

    return this._upload(buffer, key)
      .then(this._formatUploadSuccessMessage.bind(this, key))
      .then(this._printSuccessMessage.bind(this))
      .catch(function() {
        var message = this._formatUploadErrorMessage();
        return this._printErrorMessage(message);
      }.bind(this));
  },

  /**
   * PUT to navis api with the revision SHA to activate
   *
   * ember deploy:activate --revision <VERSION>
   */
  activate: function(revision) {
    var key = this.indexPrefix.concat(revision);

    return this._getRevisions()
      .then(this._activateRevision.bind(this, key))
      .then(this._printSuccessMessage.bind(this, 'Revision activated'))
      .catch(function(err) {
        var message = this._formatStackErrorMessage('There was an error activating that revision', err);
        return this._printErrorMessage(message);
      }.bind(this));
  },

  /**
   * Get the builds from navis api and list them out
   *
   * ember deploy:list
   */
  list: function() {
    return this._getRevisions()
      .then(this._printRevisions.bind(this))
      .catch(function(err) {
        var message = this._formatStackErrorMessage('There was an error calling list()', err);
        return this._printErrorMessage(message);
      }.bind(this));
  },

  /**
   * Private methods
   */

  /**
   * Upload index.html contents to Navis
   * @param {buffer} value - index.html contents
   * @param {string} key - key provided by the tagging adapter
   * @returns {RSVP.Promise}
   */
  _upload: function(value, key) {
    return new Promise(function(resolve, reject) {
      var params = this._formatUploadParams(value.toString(), key);

      return request
        .put(this.deployUrl + '/v1/apps/' + this.config.appKey + '/builds/' + key)
        .send(params)
        .set('Authorization', 'Bearer ' + this._token())
        .end(function(err, res){
          if (err) {
            var errorMessage = 'Unable to upload: ' + err.stack;
            reject(new SilentError(errorMessage));
          } else {
            this.ui.writeLine('Index file was successfully uploaded');
            resolve();
          }
        }.bind(this));
    }.bind(this));
  },

  /**
   * Gets an array of revisions that exist on the server
   * @returns {RSVP.Promise}
   */
  _getRevisions: function() {
    return new Promise(function(resolve, reject) {
      return request
        .get(this.deployUrl + '/v1/apps/' + this.config.appKey + '/builds')
        .set('Authorization', 'Bearer ' + this._token())
        .end(function(err, res){
          if (err) {
            reject(err);
          } else {
            resolve(res.body.data);
          }
        });
    }.bind(this));
  },

  /**
   * Takes a revision number, e.g., ember-app:41d59aa, and sets the index.html
   * file contents equal to that of the revision. Will error if trying to
   * activate a revision that doesn't exist.
   *
   * @param {string} key - build revision number
   * @param {array} revisions - list of existing revisions
   * @returns {RSVP.Promise}
   */
  _activateRevision: function(key, revisions) {
    var revisionsList = this._revisionsList(revisions);

    // Make sure the revision to be activated exists
    if (revisionsList.indexOf(key) > -1) {
      return new Promise(function(resolve, reject) {
        return request
          .put(this.deployUrl + '/v1/apps/' + this.config.appKey + '/builds/' + key + '/activate')
          .set('Authorization', 'Bearer ' + this._token())
          .end(function(err, res){
            if (err) {
              var errorMessage = 'Unable to upload: ' + err.stack;
              reject(new SilentError(errorMessage));
            } else {
              this.ui.writeLine('Index file was successfully uploaded');
              resolve();
            }
          }.bind(this));
      }.bind(this));
    } else {
      throw new Error("Revision doesn't exist :(");
    }
  },

  /**
   * Generates a JWT token based off the user's key
   * @returns {string}
   */
  _token: function() {
    var payload = {
      sub: this.config.userKey,
      iss: 'ember-deploy-navis',
      iat: new Date().getTime() / 1000
    }
    var token = jwt.encode(payload, this.config.userSecret);
    return token;
  },

  _formatUploadParams: function(value, key) {
    var params = {
      data: {
        attributes: {
          ref: key,
          raw_index: value
        }
      }
    };

    return params;
  },

  _formatUploadSuccessMessage: function(key) {
    var success = green('\nUpload successful!\n\n');
    var uploadMessage = white('Uploaded revision: ') + green(key);
    return success + uploadMessage;
  },

  _formatUploadErrorMessage: function() {
    var failure    = '\nUpload failed!\n';
    var suggestion = 'Did you try to upload a revision that\'s already been uploaded?\n\n';
    var solution   = 'Please run `' + green('ember deploy:list') + '` to ' + 'investigate.';
    return failure + suggestion + solution;
  },

  _revisionsList: function(revisions) {
    return revisions.map(function(rev) {
      return rev.attributes.ref;
    });
  },

  _printRevisions: function(revisions) {
    var header = green('Found the following revisions: \n');

    var revisionsList = this._revisionsList(revisions);
    revisionsList.reduce(function(prev, current, index) {
      return prev + '\n\n' + (index + 1) + ') ' + current.replace(this.indexPrefix, '');
    }.bind(this), '');

    var footer = green('\n\nUse activate() to activate one of these revisions');
    var message = header + revisionsList + footer;
    return this._printSuccessMessage(message);
  },

  _printSuccessMessage: function(message) {
    return this.ui.writeLine(message);
  },

  _printErrorMessage: function(message) {
    return Promise.reject(new SilentError(message));
  },

  _formatStackErrorMessage: function(message, error) {
    message = message + '\n\n';
    error = (error) ? (error.stack + '\n') : '';
    return message + error;
  }
});
