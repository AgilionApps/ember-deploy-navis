# ember-deploy-navis

## Deploy Ember applications to Navis.io

### Setup

From the root of your ember application's repository:

```shell
npm install --save-dev ember-cli-deploy@beta
npm install --save-dev ember-cli-deploy-revision-data
npm install --save-dev ember-cli-deploy-display-revisions
ember install git+ssh://github.com/AgilionApps/ember-deploy-navis.git
```

Set the bucket URL for your assets in `Brocfile.js`. This makes your application's asset URLs absolute -- and pointing to S3 -- instead of relative and pointing to your application's domain. The S3 URL depends on your region but is typically a concatenation of `//` + bucket name + `.s3.amazonaws.com/` e.g., `//my-marketing-site-bucket.s3.amazonaws.com`.

```javascript
var app = new EmberApp({
  fingerprint: {
    prepend: '<your-s3-bucket-url>'
  }
});
```

Edit `config/deploy.js`:

```javascript
module.exports = function(environment) {
  var DEPLOY = {
    'revision-data': {
      type: 'version-commit'
    },

    'navis': {
      appKey: '[find-me-on-navis.io]', // Staging app key
      userKey: process.env.NAVIS_USER_KEY,
      userSecret: process.env.NAVIS_USER_SECRET
    }
  };

  if (environment === 'production') {
    DEPLOY['navis']['appKey'] = '[find-me-on-navis.io]';
  }

  return DEPLOY;
};
```

Set the necessary environment variables in your shell config e.g., `~/.zshrc` or `~/.bashrc`:

```shell
### Navis creds
export NAVIS_USER_KEY="<your-navis-deploy-key>"
export NAVIS_USER_SECRET="<your-navis-deploy-secret>"
```

### Usage

Available commands:

* `ember deploy:list` to see the list of existing builds
* `ember deploy` to deploy your application for development
* `ember deploy --environment production` to deploy your application for production
* `ember deploy:activate --revision <VERSION>` to activate a specific revision

## Contribute to this addon

### Installation

In a new directory (not an ember application's directory);

```shell
git clone git@github.com:AgilionApps/ember-deploy-navis.git
npm install && bower install
```

### Link to an ember application for ease of development

In this addon's directory:

```shell
npm link
```

In an ember application's directory:

```shell
npm link ember-deploy-navis
```

If you find it simpler, you can now work on this addon from
within the ember application at
`node_modules/ember-deploy-navis`. The application is aliasing
the addon's directory, so changes made to the addon from
within your application will immediately be available.

