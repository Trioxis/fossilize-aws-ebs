var BackupRunner = require('./build/');

console.log('Runnning the backup script in ./build/');
BackupRunner.default().then((result) => {
	console.log('DONE');
	console.log('Printing output:');
	console.log(result);
	console.log('Exiting');
});
