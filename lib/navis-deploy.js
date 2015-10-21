'use strict';

var CoreObject = require('core-object');
var jwt        = require('jwt-simple');
var RSVP       = require('rsvp');
var request    = require('superagent');
var fs         = require('fs');
var readFile   = RSVP.denodeify(fs.readFile);

module.exports = CoreObject.extend({
  init: function(config) {
    this.deployHost = config.deployHost;
    this.appKey     = config.appKey;
    this.userKey    = config.userKey;
    this.userSecret = config.userSecret;
  },

  uploadBuild: function(filePath, revision, commitDetails) {
    var url = this._buildUrl([revision]);
    var token = this._token();
    return this._readFileContents(filePath).then(function(body) {
      return new RSVP.Promise(function(resolve, reject) {
        return request
          .put(url)
          .send(this._jsonPayload(revision, body, commitDetails))
          .set('Content-Type', 'application/vnd.api+json')
          .set('Accept', 'application/vnd.api+json')
          .set('Authorization', 'Bearer ' + token)
          .end(function(err, res) {
            if (err) { 
              reject(res); 
            } else {
              resolve();
            }
          });
      }.bind(this));
    }.bind(this));
  },

  uploadAsset: function(filePath, as) {
    var url = this._assetUrl();
    var token = this._token();

    return new RSVP.Promise(function(resolve, reject) {
      var req = request
        .post(url)
        .attach('asset', filePath)
        .field('file_path', as)
        .set('Authorization', 'Bearer ' + token)
        .end(function(err, res){
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      return req;
    });
  },

  activate: function(revision) {
    var url   = this._buildUrl([revision, 'activate']);
    var token = this._token();
    return new Promise(function(resolve, reject) {
      return request
        .put(url)
        .set('Content-Type', 'application/vnd.api+json')
        .set('Accept', 'application/vnd.api+json')
        .set('Authorization', 'Bearer ' + token)
        .end(function(err, res){
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
    });
  },

  list: function() {
    var url = this._buildUrl([]);
    var token = this._token();
    return new RSVP.Promise(function(resolve, reject) {
      return request
        .get(url)
        .set('Accept', 'application/vnd.api+json')
        .set('Authorization', 'Bearer ' + token)
        .end(function(err, res){
          if (err) {
            reject(err);
          } else {
            resolve(res.body.data);
          }
        });
    });
  },

  // Builds a url, takes array of segments to go after:
  // :host/deploy/v1/apps/:app_key/builds/
  _buildUrl: function(segments) {
    return [this.deployHost, 'deploy/v1/apps', this.appKey, 'builds']
      .concat(segments)
      .join('/');
  },

  _assetUrl: function() {
    return [this.deployHost, 'deploy/v1/apps', this.appKey, 'assets']
      .join('/');
  },

  _token: function() {
    var payload = {
      sub: this.userKey,
      iss: 'ember-deploy-navis',
      iat: new Date().getTime() / 1000
    }
    var token = jwt.encode(payload, this.userSecret);
    return token;
  },

  _readFileContents: function(path) {
    return readFile(path).then(function(buffer) {
      return buffer.toString();
    });
  },

  // This is a bit of a made up payload very loosely based on some preliminary
  // discussion of a 'sidepost' or multi operation extension to the json-api
  // spec. https://github.com/json-api/json-api/issues/795
  _jsonPayload: function(revision, body, commit) {
    return JSON.stringify({
      data: {
        type: 'build',
        attributes: {ref: revision, raw_index: body},
        relationships: {commit: {pointer: "/embedded/0"}},
      },
      embedded: [{
        type: 'commit',
        attributes: {
          abbr_hash:       commit.commit,
          hash:            commit.fullCommit,
          branch:          commit.branch,
          subject:         commit.subject,
          body:            commit.body,
          committer:       commit.commiter,
          committer_email: commit.committerEmail,
          committed_at:    commit.commitDate,
          last_tag:        commit.lastTag,
          commits_since_last_tag: commit.commitsSinceLastTag
        }
      }]
    });
  }
});
