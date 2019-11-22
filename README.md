# gulp-scp3 

Copy file to remote server, using ssh2 as base.  

This module was written in node v12.13.0  

---

## Install

```
$ npm install gulp-scp3 --save-dev
```

## Usage

```
import gulp from 'gulp';        // const gulp = require('gulp');
import scp from 'gulp-scp3';    // const scp = require('gulp-scp3');

gulp.task('default', () => {
  return gulp.src('**/*.js')
  .pipe(scp({
    host: 'remoteserver-ip',
    username: 'username',
    password: 'password',
    dest: '/home/username/'
  }))
  .on('error', function(err) {
    console.log(err);
  });
});
```

## Options

### options.host
Type: `String`
Default value: `localhost`

A string value that is the host of the server.

### options.port
Type: `Number`
Default value: `22`

The ssh port of the server.
Note this option wasn't tested.

### options.username
Type: `String`
Default value: `admin`

The username of the server.


### options.password
Type: `String`

The password of the user on the remote server.

### options.dest
Type: `String`
Default value: `/home/username`

Remote server directory


## LISENCE

Copyright (c) 2019 jinvillaz. Licensed under the MIT license.
