#!/usr/bin/env node

var commander = require('commander'),
	cp        = require('child_process'),
	fs        = require('fs'),
	path      = require('path');

commander
	.option('-f --file <file>', 'The C source file to run');

fs.readFile(path.join(__dirname, 'package.json'), 'utf8', function(err, data) {

	if (err) throw err;
	var pkg = JSON.parse(data);
	commander.version('v' + pkg.version);
	commander.parse(process.argv);

	if (typeof commander.file === 'undefined') {
		var filename = process.argv[2];
		if (typeof filename !== 'undefined') {
			fs.readFile(path.resolve(process.cwd(), filename), 'utf8', function(err, data) {
				if (err) throw err;
				run(data);
			});
		}
	} else {
		if (commander.file.length) {
			fs.readFile(path.resolve(process.cwd(), commander.file), 'utf8', function(err, data) {
				if (err) throw err;
				run(data);
			});
		}
	}
});

/**
 * Function that removes the shebang from the first line of the file
 * @param  {String} file The C source file as a string
 * @return {String}
 */
function removeShebang(file) {
	var lines = file.split('\n');
	if (lines[0].indexOf('#!') === 0) {
		var newFile = '';
		for (var i = 1; i < lines.length; i++) {
			if (lines[i].length) {
				newFile += lines[i] + '\n';
			}
		}
		return newFile;
	} else {
		return file;
	}
}

/**
 * A function that spawns a gcc process and pipes in the C source file and compiles it.
 * After the the file is compiled, it is then run
 * @param  {String} data
 */
function run(data) {

	var noShebang = removeShebang(data);
	var output    = '/tmp/out';
	var gcc       = cp.spawn('gcc', ['-xc', '-', '-o', output, '-std=c99']);

	gcc.stdin.write(noShebang, 'utf8');
	gcc.stdin.end();
	gcc.on('close', function(code, signal) {
		if (code === 0) {
			cp.exec(output, function(err, stdout, stderr) {
				console.log(stdout);
				if (stderr.length) console.error(stderr);
				fs.unlink(output, function(err) {
					if (err) throw err;
				});
			});
		}
	});

	gcc.stderr.setEncoding();
	gcc.stderr.on('data', function(data) {
		console.error(data);
	});

	gcc.stdout.setEncoding();
	gcc.stdout.on('data', function(data) {
		console.log(data);
	});
}

