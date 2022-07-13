Fxsnapshot
==========

Capture a set of images from a fxhash project.

Install dependencies:
```
npm install
```


Capture *count* images:

For local use:
```
node fxsnapshot.js <count>
```

The script opens the standard fxhash-webpack-boilerplate url
(http://localhost:8080/). It will work only if you use a canvas and
call fxpreview().


For remote use:
```
node fxsnapshot.js <count> <project-url>
```
