# fossilize-aws-ebs
Easily backup your Amazon EBS volumes

**This project is in alpha.** Implementation is complete, however breaking changes are likely. Nevertheless, it is being used in production in some organisations, deal with it.

[![Build Status](https://travis-ci.org/Trioxis/fossilize-aws-ebs.svg?branch=master)](https://travis-ci.org/Trioxis/fossilize-aws-ebs) [![codecov.io](https://codecov.io/github/Trioxis/fossilize-aws-ebs/coverage.svg?branch=master)](https://codecov.io/github/Trioxis/fossilize-aws-ebs?branch=master) [![Code Climate](https://codeclimate.com/github/Trioxis/fossilize-aws-ebs/badges/gpa.svg)](https://codeclimate.com/github/Trioxis/fossilize-aws-ebs)

## What does this do?

1. Analyse the tags on your EBS volumes and snapshots according to a backup tag API
2. Make snapshots as specified by the tags on EBS volumes
3. Remove snapshots as specified by the tags on snapshots

## Quickstart

Make sure you have your AWS credentials set up. Set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables or see the section ['Setting AWS Credentials'](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials) of the AWS docs.

### Tag your EBS volumes

To automatically back up an EBS volume hourly, daily, weekly, monthly and yearly, it must have a tag with key **`fossilize:config-v0`** and value **`Hourly,Daily,Weekly,Monthly,Yearly`**

You can remove types of backup from the value as necessary. See the [Backup Tag API doc](docs/BackupTagAPI.md) for explanations and more fine grained controls.

### Run the script somewhere regularly

To install the script in the current directory, run this line
```
git clone https://github.com/Trioxis/fossilize-aws-ebs.git . && npm install && npm run build
```

To do a backup once, run
```
npm start
```

This will make and delete EC2 backups as necessary and then exit. This command should be scheduled to run at least once an hour to get the full benefits of the backup manager.

## Development

### Getting Started

Make sure your [AWS credentials are set up](http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Setting_AWS_Credentials) then clone the repository to disk
```
git clone https://github.com/Trioxis/fossilize-aws-ebs.git
```
then install dependencies
```
npm install
```

### Testing

To run all tests, run
```
npm test
```
This will lint the code then run [mocha](http://mochajs.org/). Mocha finds test files in `test/` and runs them all. It will output a report of all the tests that passed, failed and are pending (tests that are not written yet). Check the [mocha docs](http://mochajs.org/) for info on how to format the tests.

If you only want to lint the code, run
```
npm run _lint
```

You can set tests to run automatically with
```
npm run watch
```
Your terminal will display updated test status as soon as save your code. (This doesn't do linting, you can use `npm run watch-lint` for that).

#### Code Coverage

Code coverage is checked using [isparta](https://github.com/douglasduteil/isparta) by running
```
npm run cover
```
This outputs a html report in `coverage/` that can be perused in a web browser. It also outputs results to console and in lcov format to send to third party coverage services (see section below)

#### Continuous Integration

We're using [Travis CI](https://travis-ci.org/Trioxis/fossilize-aws-ebs) for continuous integration. It runs all tests and sends code coverage information to [Codecov](https://codecov.io/github/Trioxis/fossilize-aws-ebs) and [CodeClimate](https://codeclimate.com/github/Trioxis/fossilize-aws-ebs). Check [`.travis.yml`](.travis.yml) for the tasks that are run in CI.

Note: the `CODECLIMATE_REPO_TOKEN` environment variable must be set in Travis CI to successfully send coverage information to CodeClimate

### Building

This app is written using [ES6 features](https://github.com/lukehoban/es6features) such as [arrow functions](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/Arrow_functions), [modules](https://hacks.mozilla.org/2015/08/es6-in-depth-modules/) and [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise). These features are not yet fully implemented in the Node.js engine that runs the app, so it is necessary to compile the code (using [Babel](https://babeljs.io/)) down to ES5.

To build the code, run
```
npm run build
```
The built code appears in the `build/` directory. Don't forget the `run` part of the command, `npm build` does nothing.

### Running

To actually run the app, run
```
npm start
```
This runs the [`index.js`](index.js) file, which uses the built code from the previous step. In the beginning this won't do anything useful since most of the code hasn't been written yet. Running may change later once the code is closer to production stage.

### Backup Runner API

The function exported by [`src/index.js`](src/index.js) should run the entire backup process (described in 'What does this do?' section above) using the APIs provided by the modules in `src/`. For detail on these APIs, see the [API doc](docs/API.md).

### Backup Tag API

See the [Backup Tag API doc](docs/BackupTagAPI.md).

### Logging

This branch sends a metric JSON object to a CloudWatch Log group named `fossilize`, log stream `fossilize-aws-ebs-metrics`. This object can be interpreted by CloudWatch and converted in to metrics. This branch also dumps raw log output to the `fossilize` group in a log stream named `fossilize-aws-ebs-logs`. Make sure the `fossilize` log group exists and the script will create the streams for you.

The metric object looks like the following and can be filtered for information

```JSON
{
    "ec2Objects": {
        "snapshots": 12,
        "volumes": 3
    },
    "backups": {
        "backupTypes": 4,
        "expiredSnaps": 1,
        "orphanedSnaps": 2
    },
    "actions": {
        "create": 1,
        "delete": 1,
        "created": [ "vol-4629578c - Hourly" ],
        "deleted": [ "snap-5732505b" ]
    },
    "warnings": 0,
    "warningMessages": [],
    "timestamp": 1460689503445
}
```
