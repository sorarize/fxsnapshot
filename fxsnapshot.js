const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const total = parseInt(process.argv[2]);
let count = 1;

let browser;
let page;

if (isNaN(total)) {
  console.log('usage: node fxsnapshot.js <count>');
  process.exit(1);
}

const localUrl = 'http://localhost:8080';
let url = process.argv[3] || localUrl;
const isLocal = url == localUrl;

const viewportSettings = {
  deviceScaleFactor: 1,
  width: 800,
  height: 800,
};

const getIpfsUrl = async (url) => {
  await page.goto(url);

  return await page.evaluate(() => {
    return document.querySelector('a[href^="https://gateway.fxhash2.xyz/ipfs"][class^="Button"]').href.split('/?')[0];
  });
}

const getFxhashedUrl = (url) => {
  const alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const fxhash = "oo" + Array(49).fill(0).map(_ => alphabet[(Math.random() * alphabet.length) | 0]).join('');
  return `${url}/?fxhash=${fxhash}`;
}

const saveFrame = async (filename) => {
  const base64 = await page.$eval('canvas', (el) => {
    return el.toDataURL();
  });
  const pureBase64 = base64.replace(/^data:image\/png;base64,/, "");
  const b = Buffer.from(pureBase64, "base64");
  await fs.writeFile(filename, b, (err) => {
    console.log(err ? err : filename);
  });
};

const takeShot = async () => {
  const { fxhash, title } = await page.evaluate(() => {
    return {
      fxhash: window.fxhash,
      title: document.title,
    };
  });
  const iteration = String(count).padStart(4, '0');
  const f = `images/${title}-${iteration}-${fxhash}.png`;
  console.log(f);
  await saveFrame(f);
  if (count < total) {
    count += 1;
    await page.goto(getFxhashedUrl(url));
    bindFxpreviewHandler();
  }
  else {
    process.exit(0);
  }
}

// waitForEvent from https://github.com/puppeteer/puppeteer/issues/2455
async function waitForEvent(event, timeout = 10000) {
  return Promise.race([
    page.evaluate(
      event => new Promise(resolve => document.addEventListener(event, resolve)),
      event
    ),
    page.waitForTimeout(timeout)
  ]);
}

async function bindFxpreviewHandler() {
  await waitForEvent('fxhash-preview');
  takeShot();
}

(async () => {

  browser = await puppeteer.launch({
    ignoreHTTPSErrors: true,
  });

  if (!browser) {
    process.exit(1);
  }

  page = await browser.newPage();
  await page.setViewport(viewportSettings);

  if (!page) {
    process.exit(1);
  }

  if (!isLocal) {
    url = await getIpfsUrl(url);
  }

  page.on('error', (err) => {
    console.log('PAGER ERROR:', err);
  });

  await page.goto(getFxhashedUrl(url));
  bindFxpreviewHandler();

})();
