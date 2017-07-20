P2P fetcher
============

## 使用方法

> npm

```js
const videoId = '****';
const server = '/';
const fs = new fetchSource(server, videoId);

const resourceUrl = '**/**.ts';
const timeout = 1500;

fs.fetch(resourceUrl,timeout).then(buf=>{
    console.log(typeof buf); //[ArrayBuffer] 
});
```

> 包引入

```html
<html>

...

<body>

<script src="path/to/fetch-source.js">
<script>
const videoId = '****';
const server = '/';
const fs = new fetchSource(server, videoId);

const resourceUrl = '**/**.ts';
const timeout = 1500;

fs.fetch(resourceUrl,timeout).then(buf=>{
    console.log(typeof buf); //[ArrayBuffer] 
});
</script>

</body>
</html>

```