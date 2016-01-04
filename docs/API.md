# Module APIs

## ActionCreator

[`ActionCreator.js`](../src/ActionCreator.js) exports three named functions. They all return objects that represent an action to be used by the `Actioner`

- `makeDeleteAction(snap)` - accepts an object that represents a snapshot in EC2. It returns an object that represents an action that will delete the snapshot.
- `makeCreateAction(volume, snapList)` - accepts an object that represents an EBS volume and an array of snapshot objects that exist in EC2. Returns an array of actions that will create the required backup snapshots for the EBS volume.
- `determineBackupsNeeded(volume, snapList)` - accepts an EBS volume object and an array of snapshot objects. This simply determines that types of snapshots required and returns them as an array. This should be used by `makeCreateAction` to figure out what creation actions it needs to make.
