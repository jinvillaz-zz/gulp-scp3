# gulp-scp3 

Copy file to remote server, using ssh2 as base. 

This is a [Node.js](https://nodejs.org/en/) module available through the
[npm registry](https://www.npmjs.com/). 

This module was written in `node v12.13.0` 

Also tested with gulp 4 [Gulp](https://www.npmjs.com/package/gulp) 

node.js version supported  
`node v10.17.0` up

---

## Install

```
$ npm install gulp-scp3 --save-dev
```

## Usage

```js
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

## Repository 
[gulp-scp3](https://github.com/jinvillaz/gulp-scp3) 


## Author
[Jhonatan Villanueva](https://github.com/jinvillaz) 

## Thanks for your donation
If you want to support this free project. Any help is welcome. You can donate by clicking one of the following links:

<a target="blank" href="https://www.paypal.me/jinvillaz"><img src="https://img.shields.io/badge/Donate-PayPal-blue.svg"/></a>



## LISENCE

Copyright (c) 2019 jinvillaz. Licensed under the MIT license.
