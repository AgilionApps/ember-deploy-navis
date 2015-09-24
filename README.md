# ember-deploy-navis

## Deploy Ember applications to Navis.io using ember-cli-deploy

### Setup

From the root of your ember application's repository:

```shell
npm install --save-dev ember-cli-deploy@beta
npm install --save-dev ember-cli-deploy-revision-data
npm install --save-dev ember-cli-deploy-display-revisions
ember install git+ssh://github.com/AgilionApps/ember-deploy-navis.git
```

### Deploy Config

To deploy to Navis you will need two pieces of information from Navis:

1. Your Navis.io `appKey`. This is available on the view application screen.
   The `appKey` is unique per application, per environment.
2. Your Navis.io deploy credentials, the `userKey` and `userSecret`. These
   are available on your profile page. Your user credentials are used for all 
   Navis apps.

You will typically want to export your user credentials as environmental vars.

In `~/.zshrc` or `~/.bashrc` (or similar):

```shell
### Navis creds
export NAVIS_USER_KEY="<your-navis-deploy-key>"
export NAVIS_USER_SECRET="<your-navis-deploy-secret>"
```

You can now configure ember-cli-deploy.

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
      userSecret: process.env.NAVIS_USER_SECRET,
      uploadAssets: true //default
    }
  };

  if (environment === 'production') {
    DEPLOY['navis']['appKey'] = '[find-me-on-navis.io]';
  }

  return DEPLOY;
};
```

#### Navis Asset Hosting

By default ember-deploy-navis will upload your assets to the navis asset host.
You can disable this behaviour by setting `uploadAssets` to `false`.

To take advantage of the assets you must prepend your navis asset host 
path onto asset URLs. Add the following to `ember-cli-build.js` or 
`Brocfile.js`: 

```javascript
var app = new EmberApp({
  fingerprint: {
    prepend: '//cdn.navis.io/<your app_key>/'
  }
});
```

You are now ready to deploy!

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

