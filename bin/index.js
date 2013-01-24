#!/usr/bin/env node

var commander = require('commander'),
	spawn     = require('child_process').spawn,
	exec      = require('child_process').exec,
	fs        = require('fs'),
	path      = require('path');

commander
	.option('-f --file <file>', 'The C source file to run');

fs.readFile(path.join(__dirname, '..', 'package.json'), 'utf8', function(err, data) {

	if (err) throw err;
	var pkg = JSON.parse(data);
	commander.version('v' + pkg.version);
	commander.parse(process.argv);

	if (typeof commander.file === 'undefined') {

		var stdin = process.stdin;
		stdin.resume();
		stdin.setEncoding();

		stdin.on('data', function(data) {
			var noShebang = removeShebang(data);
			var output = path.join(process.cwd(), 'out');
			var gcc = spawn('gcc', ['-xc', '-', '-o', output]);
			gcc.stdin.write(noShebang, 'utf8');
			gcc.stdin.end();
			gcc.on('close', function(code, signal) {
				if (code === 0) {
					console.log(output);
					exec(output, function(err, stdout, stderr) {
						console.log(stdout);
						if (stderr.length) console.error(stderr);
						fs.unlink(output, function(err) {
							if (err) throw err;
						});
					});
				} else {
					console.error('An error occured');
				}
			});
		});

		stdin.on('end', function() {
			stdin.destroy();
		});
	} else {
		if (commander.file.length) {
			fs.readFile(path.resolve(process.cwd(), commander.file), 'utf8', function(err, data) {
				if (err) throw err;
				console.log(removeShebang(data));
			});
		}
	}
});

function removeShebang(file) {
	var lines = file.split('\n');
	var newFile = '';
	for (var i = 1; i < lines.length; i++) {
		if (lines[i].length) {
			newFile += lines[i] + '\n';
		}
	}
	return newFile;
}

