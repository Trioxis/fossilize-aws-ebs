var BackupRunner = require('./build/');

console.log('Runnning the backup script in ./build/');
BackupRunner.default()
	.then(() => {
		console.log('Done, exiting');
});
