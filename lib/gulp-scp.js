const path = require('path');
const through = require('through2');
const debugMode = require('debug');
const Client = require('./client');
const debug = debugMode('gulp-scp3');

function _createClient(options) {
    const client = new Client(options);
    client.on('connect', () => {
        debug('ssh connect %s', options.host);
    });
    client.on('close', () =>{
        debug('ssh connect %s', options.host);
    });
    client.on('mkdir', (dir) => {
        debug('mkdir %s', dir);
    });
    client.on('write', (o) => {
        debug('write %s', o.destination);
    });
    client.on('error', (err) => {
        debug('error %s', err);
    });
    return client;
}
  
function _fixWinPath(str) {
    return str.replace(/\\/g, '/');
}

const gulpScpTask = (options = {}) => {
    options.host = options.host || 'localhost';
    options.username = options.username || 'admin';
    options.dest = options.dest || '/home/' + options.username;

    const client = _createClient(options);
    
    if (typeof options.watch === 'function') {
        options.watch(client);
    }

    return through.obj((file, enc, callback) => {
        if (file.isStream()) {
            return callback(new Error('Streaming not supported.'));
        }

        if (file.stat.isDirectory()) {
            debug('ignore directory %s', file.path);
            return callback();
        }

        const dest = _fixWinPath(path.join(options.dest, file.relative));
        client.mkdir(path.dirname(dest), (err) => {
            if (err) {
                return callback(err);
            }
            client.write({
                destination: dest,
                content: file.contents
            }, callback);
        });
    }, (callback) => {
        client.close();
        callback();
    });
};

module.exports = gulpScpTask;
