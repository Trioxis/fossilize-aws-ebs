# Module APIs

## ActionCreator

[`ActionCreator.js`](../src/ActionCreator.js) exports three named functions. They all return objects that represent an action to be used by the `Actioner`

- `makeDeleteAction(snap)` - accepts an object that represents a snapshot in EC2. It returns an object that represents an action that will delete the snapshot.
- `makeCreateAction(volume, snapList)` - accepts an object that represents an EBS volume and an array of snapshot objects that exist in EC2. Returns an array of actions that will create the required backup snapshots for the EBS volume.
- `determineBackupsNeeded(volume, snapList)` - accepts an EBS volume object and an array of snapshot objects. This simply determines that types of snapshots required and returns them as an array. This should be used by `makeCreateAction` to figure out what creation actions it needs to make.

## Actioner

[`Actioner.js`](../src/Actioner.js) exports one named function that accepts an action or array of actions created by the `ActionCreator`.

- `doActions(action)` - Accepts an action or array of actions. Contacts EC2 to perform each action, such as snapshotting a volume or deleting a snapshot. Returns a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) that always resolves to an array that describes the outcome of each action (success or failure and why). It will use [AWS Node SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html) methods such as [createSnapshot](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#createSnapshot-property) to carry out these actions and return relevant information from the AWS response.

## EC2Store

[`EC2Store.js`](../src/EC2Store.js) exports a class that can be used to get and store information from EC2. The class can be constructed like this
```JavaScript
import EC2Store from './EC2Store';
let ec2 = new EC2Store(params);
```
where `params` is an object that configures how the class will contact EC2 (things like availability zone, user account id and/or credentials). Now that we have an `EC2Store` instance called `ec2`, we can use it to get information from EC2:

- `ec2.listSnapshots` - returns a Promise that resolves to an array of all snapshots in EC2 owned by the current user.
- `ec2.listEBS` - returns a Promise that resolves to an array of all the EBS volumes in EC2.

## SnapshotAnalyser

[`SnapshotAnalyser.js`](../src/SnapshotAnalyser.js) exports two named functions that examine whether or not snapshots should continue to exist.

- `findDeadSnapshots(snapshotList)` - accepts an array of snapshot objects and returns an array of snapshots that have expired.
- `snapshotIsDead(snapshot)` - given a snapshot object, returns true if the snapshot has expired. It determines this based on tags that represent things like expiry dates. If the snapshot is still valid, the function returns false. 