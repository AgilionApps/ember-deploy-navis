# ember-deploy-navis

## Use this addon in an ember application

### Setup

From the root of your ember application's repository:

`ember install ember-cli-deploy`
`ember g deploy-config`
`ember install git@github.com:AgilionApps/ember-deploy-navis.git`

Set the bucket URL for your assets in `Brocfile.js`. This makes your application's asset URLs absolute -- and pointing to S3 -- instead of relative and pointing to your application's domain.

```
fingerprint: {
  prepend: '<your-s3-bucket-url>'
}
```

Edit `config/deploy.js`:

```js

module.exports = {
  "development": {
    "store": {
      "type": "Navis",
      "appKey": "<your-navis-app-id>",
      "userSecret": process.env.NAVIS_USER_SECRET,
      "userKey": process.env.NAVIS_USER_KEY
    },

    "assets": {
      "type": "s3",
      "accessKeyId": "<your-s3-access-id>",
      "secretAccessKey": process.env.S3_ACCESS_SECRET,
      "bucket": "<your-s3-bucket-name>"
    }
  }
  // Make an entry for each environment
}
```

Set the necessary environment variables in your shell config e.g., `~/.zshrc` or `~/.bashrc`:

```
### Navis creds
export NAVIS_USER_KEY="<your-navis-deploy-key>"
export NAVIS_USER_SECRET="<your-navis-deploy-secret>"

### S3 creds
export S3_ACCESS_SECRET="<your-s3-access-secret>"
```

### Usage

Available commands:

* `ember deploy:list` to see the list of existing builds
* `ember deploy` to deploy your application
* `ember deploy:activate --revision <VERSION>` to activate a specific revision

## Contribute to this addon

### Installation

In a new directory (not an ember application's directory);

`git clone git@github.com:AgilionApps/ember-deploy-navis.git`
`npm install && bower install`

### Link to an ember application for ease of development

In this addon's directory:

`npm link`

In an ember application's directory:

`npm link ember-deploy-navis`

If you find it simpler, you can now work on this addon from
within the ember application at
`node_modules/ember-deploy-navis`. The application is aliasing
the addon's directory, so changes made to the addon from
within your application will immediately be available.

