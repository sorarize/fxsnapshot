Fxsnapshot
==========

Capture a set of images from a fxhash project.

### Install dependencies
```
npm install
```


### Capture *count* images

**For local use**
```
node fxsnapshot.js <count>
```

or use npm script

```
npm run shot 5
```

The script opens the standard fxhash-webpack-boilerplate url
(http://localhost:8080/). It will work only if you use a canvas and
call fxpreview().


**For remote use**
```
node fxsnapshot.js <count> <project-id|project-url>
```

examples:
```
npm run shot 15
npm run shot 15 10332
npm run shot 15 https://www.fxhash.xyz/generative/slug/the-generative-octopuses
```
