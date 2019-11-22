const fs = require('fs');
const path = require('path');
const async = require('async');
const Connection = require('ssh2');
const events = require('events'); 
const EventEmitter = events.EventEmitter;

function _getFolderAttr(platform, attrs) {
    const DEFAULT_MODE = '0755';
    if (platform === 'win32') {
        return DEFAULT_MODE;
    }
    if (attrs) {
        return attrs.mode || DEFAULT_MODE;
    }
}

function _unixy(filepath) {
    if (process.platform === 'win32') {
        return filepath.replace(/\\/g, '/');
    }
    return filepath;
}

class Client extends EventEmitter {

    constructor(options) {
        super();
        this._options = options || {};
        this.remote = {};
    }

    sftp(callback) {
        if (this.__sftp) {
            callback(null, this.__sftp);
            return;
        }
    
        const remote = Object.assign(this.remote, this._options);
        if (this.__ssh) {
            this.__ssh.connect(remote);
            return;
        }
    
        const ssh = new Connection();
        ssh.on('connect', () => {
            this.emit('connect');
        });
        ssh.on('ready', () => {
            this.emit('ready');
    
            ssh.sftp((err, sftp) => {
                if (err) throw err;
                // save for reuse
                this.__sftp = sftp;
                callback(err, sftp);
            });
        });
        ssh.on('error', (err) => {
            this.emit('error', err);
            callback(err);
        });
        ssh.on('end', () => {
            this.emit('end');
        });
        ssh.on('close', () => {
            this.emit('close');
        });
        ssh.on('keyboard-interactive', (name, instructions, instructionsLang, prompts, finish) => {
            this.emit('keyboard-interactive', name, instructions, instructionsLang, prompts, finish);
        });
        ssh.on('change password', (message, language, done) => {
            this.emit('change password', message, language, done);
        });
        ssh.on('tcp connection', (details, accept, reject) => {
            this.emit('tcp connection', details, accept, reject);
        });
        ssh.connect(remote);
        this.__ssh = ssh;
    }

    close() {
        if (this.__sftp) {
            this.__sftp.end();
            this.__sftp = null;
        }
        if (this.__ssh) {
            this.__ssh.end();
            this.__ssh = null;
        }
    }

    mkdir(dir, attrs, callback) {
        if (typeof attrs === 'function') {
            callback = attrs;
            attrs = undefined;
        }
    
        if (attrs) {
            attrs.mode = _getFolderAttr(process.platform, attrs);
        }
    
        const dirs = [];
        let exists = false;
    
        this.sftp(async (err, sftp) => {
            if (err) {
                return callback(err);
            }
            
            // for record log
            const mkdir = (dir, callback) => {
                this.emit('mkdir', dir);
                sftp.mkdir(dir, attrs, callback);
            };
            const validateDirectory = () => {
                return new Promise((resolve) => {
                    // detect if the directory exists
                    sftp.stat(dir, (err) => {
                        if (err) {
                            dirs.push(dir);
                            dir = path.dirname(dir);
                        } else {
                            exists = true;
                        }
                        resolve();
                    });
                });
            };
            while (!exists) {
                await validateDirectory();
            }
            async.eachSeries(dirs.reverse(), mkdir, callback);
        });
    }

    write(options, callback) {
        let destination = options.destination;
        destination = _unixy(destination);

        const attrs = options.attrs;
        const content = options.content;
        let chunkSize = options.chunkSize || 32768;

        this.sftp((err, sftp) => {
            if (err) {
                return callback(err);
            }

            const _write = (handle) => {
                this.emit('write', options);
                let length;
                let lastIndex = 0;
                let lastCursor = 0;

                if (Buffer.isBuffer(content)) {
                    let contents = [];
                    length = parseInt((content.length - 1) / chunkSize, 10) + 1;

                    for (let i = 0; i < length; i++) {
                        contents.push(content.slice(i * chunkSize, (i + 1) * chunkSize));
                    }
                    async.eachSeries(contents, (buf, callback) => {
                        this.emit('transfer', buf, lastCursor, length);
                        sftp.write(handle, buf, 0, buf.length, lastIndex, (err) => {
                            lastIndex += buf.length;
                            lastCursor += 1;
                            callback(err);
                        });
                    }, () => {
                        sftp.close(handle, callback);
                    });
                } else if (typeof content === 'number') {
                    // content is a file descriptor
                    length = parseInt((attrs.size - 1) / chunkSize, 10) + 1;
                    let range = new Array(length);
                    async.eachSeries(range, (pos, callback) => {
                        chunkSize = Math.min(chunkSize, attrs.size - lastIndex);
                        if (!chunkSize) {
                            callback(err);
                            return;
                        }
                        let buf = new Buffer(chunkSize);
                        fs.read(content, buf, 0, chunkSize, lastIndex, (err, byteRead, buf) => {
                            this.emit('transfer', buf, lastCursor, length);
                            sftp.write(handle, buf, 0, buf.length, lastIndex, (err) => {
                                lastIndex += buf.length;
                                lastCursor += 1;
                                callback(err);
                            });
                        });
                    }, () => {
                        sftp.close(handle, () => {
                            fs.close(content, callback);
                        });
                    });
                } else {
                    throw new Error('Content should be buffer or file descriptor');
                }
            };

            sftp.open(destination, 'w', attrs, (err, handle) => {
                if (err) {
                    // destination is directory
                    destination = path.join(destination, path.basename(options.source));
                    destination = _unixy(destination);

                    // for emit write event
                    options.destination = destination;
                    sftp.open(destination, 'w', attrs, (err, handle) => {
                        _write(handle);
                    });
                } else {
                    _write(handle);
                }
            });
        });
    }
}

module.exports = Client;
