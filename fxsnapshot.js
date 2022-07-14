const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const localUrl = 'http://localhost:8080';
const total = parseInt(process.argv[2]);
const timeout = parseInt(process.argv[4]) || 10000;

const viewportSettings = {
  deviceScaleFactor: 1,
  width: 800,
  height: 800,
};

let count = 1;
let browser;
let page;
let url = process.argv[3] || localUrl;

const isLocal = url == localUrl;

if (isNaN(total)) {
  console.log('usage: node fxsnapshot.js <count>');
  process.exit(1);
}

if (!isNaN(url)) { // id → url
  url = `https://www.fxhash.xyz/generative/${url}`;
}

const getIpfsUrl = async (url) => {
  await page.goto(url);

  const IpfsUrl = await page.evaluate(() => {
    return document.querySelector('a[href^="https://gateway.fxhash2.xyz/ipfs"][class^="Button"]')?.href?.split('/?')[0];
  });

  if (!IpfsUrl) {
    console.log('usage: node fxsnapshot.js <count> <project-id|project-url>');
    process.exit(1);
  }

  return IpfsUrl;
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
}

// waitForEvent from https://github.com/puppeteer/puppeteer/issues/2455
async function waitForEvent(event) {
  return Promise.race([
    page.evaluate(
      event => new Promise(resolve => window.addEventListener(event, resolve)),
      event
    ),
    page.waitForTimeout(timeout)
  ]);
}

async function waitForMessage() {
  return new Promise(resolve => {
    page.on('console', msg => {
      const text = msg.text();
      let m = text.match(/TRIGGER PREVIEW/);
      m && resolve();
    })
  });
}

async function go() {
  await page.goto(getFxhashedUrl(url));

  if (isLocal) {
    await waitForMessage();
  } else {
    await waitForEvent('fxhash-preview');
  }
  await takeShot();

  if (count < total) {
    count += 1;
    await go();
  }
  else {
    process.exit(0);
  }
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

  await go();

})();
