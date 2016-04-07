# Module APIs

## Object Specifications

These objects are a more useful (to us) representation of EC2 objects and are passed around the Modules below. The values are mapped from a combination of the [EC2 Response](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html) and the 'Name' and [`backups:config-v0` tags](./BackupTagAPI.md) on the object.

### Fossilize Snapshot Object

```JavaScript
{
	Name,
	// The value of the 'Name' EC2 tag
	SnapshotId,
	// The EC2 resource id of the snapshot, e.g. 'snap-1234abcd'
	FromVolumeId,
	// The EC2 resource id of the volume that this snapshot was made from, e.g. 'vol-1234abcd'
	FromVolumeName,
	// The value of the 'Name' EC2 tag of the volume at creation time (it is possible this could have changed since creation)
	StartTime,
	// A moment.js object representing the time the snapshot was created
	ExpiryDate,
	// A moment.js object representing the time after which this snapshot has expired. Can be
	// 'undefined' if no ExpiryDate was specified in the `backups:config-v0` tag
	BackupType,
	// The name of the backup type this snapshot is (one of the values from the volume's BackupTypes)
	Tags: {	}
	// The EC2 tags on the snapshot, where the property names are the 'Key' and the values are their 'Value'
}
```

### Fossilize Volume Object

```JavaScript
{
	VolumeId,
	// The EC2 resource id of the volume, e.g. 'vol-1234abcd'
	Name,
	// The value of the 'Name' EC2 tag. If one doesn't exist, it is set to the VolumeId
	BackupConfig: {
		BackupTypes: [
			// An object for every item in the 'backups:config-v0' tag of the volume
			{
				Name,
				// The Alias of the backup type if it exists, otherwise '[Frequency|Expiry]'
				Frequency,
				// How often this backup should occur, in hours
				Expiry
				// How long snapshots of this time should exist, in hours
			}
		]
	},
	Tags: { },
	// The EC2 tags on the volume, where the property name are the 'Key' and the values are their 'Value'
	Snapshots: { }
	// [OPTIONAL] Each property name of this object is the name of a 'BackupType'. The property contains
	// an array of all the snapshots with the same BackupType and that have the same 'FromVolumeName' as this
	// volume's 'Name'.
}
```

### Fossilize Action Objects

#### Make Snapshot Action

```JavaScript
{
	Action: 'SNAPSHOT_VOLUME',
	VolumeId,
	// EC2 resource id of the volume being backed up
	VolumeName,
	// Value of the EC2 Tag with Key 'Name'
	BackupType,
	// The type of backup this snapshot will represent
	ExpiryDate
	// A moment.js object that represents the point in time that this snapshot expires.
	// It should be the current time + the number of hours defined in Expiry for the BackupType
}
```

#### Delete Snapshot Action

```JavaScript
{
	Action: 'DELETE_SNAPSHOT',
	SnapshotId,
	// EC2 resource id of the snapshot to delete
}
```

## Modules

## ActionCreator

[`ActionCreator.js`](../src/ActionCreator.js) exports three named functions. They all return objects that represent an action to be used by the `Actioner`

- `makeDeleteAction(snap)` - accepts an object that represents a snapshot in EC2. It returns an object that represents an action that will delete the snapshot.
- `makeCreationActions(volume)` - accepts a Fossilize Volume object (with `Snapshots` defined). Returns an array of `SNAPSHOT_VOLUME` Fossilize Action objects that will create the required backup snapshots for the EBS volume.
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
where `params` is an object that configures how the class will contact EC2 (things like availability zone, user account id and/or credentials). Now that we have an `EC2Store` instance called `ec2`, we can use it to get information from EC2. These functions should only return EC2 objects that have a `backups:config-v0` tag and should be mapped to a more useful format (which is described in [tests](../test/_TestEC2Store.js)).

`ec2.listSnapshots` - returns a Promised object of the form `{snapshots, warnings}`. `snapshots` is an array of all snapshots in EC2 with a tag named `backups:config-v0`, represented as Fossilize Snapshot objects.


`ec2.listEBS` - returns a Promised object of the form `{volumes, warnings}`. `volumes` is a array of all the EBS volumes in EC2 that have a tag named `backups:config-v0`, represented as Fossilize Volume objects (without `Snapshots` defined).

The `warnings` property of the above objects is an array of strings that describe problems that occurred while parsing EC2 objects.

## Analyser

[`Analyser.js`](../src/Analyser.js) exports two named functions that examine whether or not snapshots should continue to exist.

- `matchSnapsToVolumes(volumes, snapList)` - given an array of Fossilize Volumes (with no `Snapshots` property defined) and an array of Fossilize Snapshots, returns `{matchedVolumes, orphanedSnaps}` where `matchedSnapshots` is the array of Fossilize Volumes with `Snapshots` defined and `orphanedSnapshots` are all the Fossilize Snapshots that had no `FromVolumeName` matching `Name` value in the Fossilize Volumes.
- `sortSnapsByMostRecent(snapList)` - returns an array of snapshots sorted by most recently created first.
- `findDeadSnapshots(snapshotList)` - accepts an array of snapshot objects and returns an array of snapshots that have expired.
