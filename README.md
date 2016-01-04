# aws-backup-manager
Automatically back up EBS volumes using tags

[![Build Status](https://travis-ci.org/Trioxis/aws-backup-manager.svg?branch=master)](https://travis-ci.org/Trioxis/aws-backup-manager)

## What does this do?

1. Analyse the tags on your EBS volumes and snapshots according to a backup tag API
2. Make snapshots as specified by the tags on EBS volumes
3. Remove snapshots as specified by the tags on snapshots

## Getting Started

Clone the repository to disk
```
git clone https://github.com/Trioxis/aws-backup-manager.git
```
then install dependencies
```
npm install
```

## Testing

To run all tests, run
```
npm test
```
This will lint the code then run [mocha](http://mochajs.org/). Mocha finds test files in `test/` and runs them all. It will output a report of all the tests that passed, failed and are pending (tests that are not written yet). Check the [mocha docs](http://mochajs.org/) for info on how to format the tests.

If you only want to lint the code, run
```
npm run lint
```
## Building

This app is written using [ES6 features](https://github.com/lukehoban/es6features) such as [arrow functions](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Functions/Arrow_functions), [modules](https://hacks.mozilla.org/2015/08/es6-in-depth-modules/) and [Promises](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise). These features are not yet fully implemented in the Node.js engine that runs the app, so it is necessary to compile the code (using [Babel](https://babeljs.io/)) down to ES5.

To build the code, run
```
npm run build
```
The built code appears in the `build/` directory. Don't forget the `run` part of the command, `npm build` does nothing.

## Running

To actually run the app, run
```
npm start
```
This runs the [`index.js`](index.js) file, which uses the built code from the previous step. In the beginning this won't do anything useful since most of the code hasn't been written yet. Running may change later once the code is closer to production stage.

## Backup Runner API

The function exported by [`src/index.js`](src/index.js) should run the entire backup process (described in 'What does this do?' section above) using the APIs provided by the modules in `src/`. For detail on these APIs, see the [API doc](docs/API.md)

## Backup Tag API

_To be finialised_
