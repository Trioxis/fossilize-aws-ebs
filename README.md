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

## Backup Tag API

_To be finialised_
