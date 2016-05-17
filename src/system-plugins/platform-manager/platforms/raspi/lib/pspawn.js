// Modeled after:
// https://gist.github.com/dylang/7416872

var spawn = require('child_process').spawn;
var q = require('q');

// Runs a spawned process and returns its output as a promise
function pspawn(command, args, options) 
{
    var process;
    var stderr = '';
    var stdout = '';
    var deferred = q.defer();

    process = spawn(command, args, options);

    process.stdout.on('data', function (data) {
        data = data.toString();
        deferred.notify(data);
        stdout += data;
    });
    process.stderr.on('data', function (data) {
        data = data.toString();
        deferred.notify(data);
        stderr += data;
    });

    // Listen to the close event instead of exit
    // They are similar but close ensures that streams are flushed
    process.on('close', function (code) {
        var fullCommand;
        var error;

        if (code) {
            // Generate the full command to be presented in the error message
            if (!Array.isArray(args)) {
                args = [];
            }

            fullCommand = command;
            fullCommand += args.length ? ' ' + args.join(' ') : '';

            // Build the error instance
            error = 'Failed to spawn "' + fullCommand + ' -- ' + stderr;

            return deferred.reject(error);
        }

        return deferred.resolve([stdout, stderr]);
    });

    return deferred.promise;
}

module.exports = pspawn;