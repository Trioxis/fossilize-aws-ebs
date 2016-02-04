var BackupRunner = require('./build/');

console.log('Runnning the backup script in ./build/');
console.log();
BackupRunner.default().then(() => {
	console.log();
	console.log('Done, Exiting');
});
