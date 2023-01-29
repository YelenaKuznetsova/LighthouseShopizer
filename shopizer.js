const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse/lighthouse-core/fraggle-rock/api.js')
const fs = require('fs')

const waitTillHTMLRendered = async (page, timeout = 30000) => { //waiting for a full page load
    const checkDurationMsecs = 1000; //if the page size doen't change (several checks), then the page is fully loaded
    const maxChecks = timeout / checkDurationMsecs;
    let lastHTMLSize = 0;
    let checkCounts = 1;
    let countStableSizeIterations = 0;
    const minStableSizeIterations = 3;

    while(checkCounts++ <= maxChecks){
    let html = await page.content();
    let currentHTMLSize = html.length;

    let bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    if(lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize)
    countStableSizeIterations++;
    else
    countStableSizeIterations = 0;

    if(countStableSizeIterations >= minStableSizeIterations) {
        console.log("Fully Rendered Page: " + page.url());
        break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitForTimeout(checkDurationMsecs);
    }
};

async function captureReport() { //we will call the function at the end of the script
    const browser = await puppeteer.launch({args: ['--allow-no-sandbox-job', '--allow-sandbox-debugging', '--no-sandbox', '--disable-gpu', '--disable-gpu-sandbox', '--display', '--ignore-certificate-errors', '--disable-storage-reset=true']});
    //arguments in '--' for 1)opening Chrome without a window/display; 2) ignore certificate; 3) way of clicking
    const page = await browser.newPage() // open new page in Chrome
    await page.setViewport({"width":500,"height":1080}) //size fullHD, change if we emulate a mobile view

    const navigationPromise = page.waitForNavigation({timeout: 30000, waitUntil: ['domcontentloaded']}) // wait 30 sec for the DOMmodel to load

    const flow = await lighthouse.startFlow(page, { //define a tool that will measure UI
        name: 'Shopizer', //set any name
        configContext: {
        settingsOverrides: {
        throttling: {
        rttMs: 40, // recommendation for Google- Ok
        throughputKbps: 10240, //~ 10Mb Internet, recommendation for Google, don't write more than possible
        cpuSlowdownMultiplier: 1, // 1 - use full CPU, 2 - use half of CPU
        requestLatencyMs: 0, // not to change 0
        downloadThroughputKbps: 0, // not to change 0
        uploadThroughputKbps: 0 // not to change 0
        },
        throttlingMethod: "simulate", // not to change
        screenEmulation: { // not to change
        mobile: false, // true if we emulate a mobile view
        width: 1920, // change if we emulate a mobile view
        height: 1080, // change if we emulate a mobile view
        deviceScaleFactor: 1, // not to change
        disabled: false, // not to change
        },
        formFactor: "desktop", //emulation of the desktop/mobile view of Chrome
        onlyCategories: ['performance'],
        },
        },
        });

    //View Links
    let HomePage = 'http://localhost:80/';
    let Tables_Tab = 'http://localhost:80/category/tables';
    let Open_Cart = 'http://localhost:80/cart';
    let Proceed_to_Checkout = 'http://localhost:80/checkout';

    async function sleep(ms) {
      return new Promise((resolve) => {
        setTimeout(resolve, ms);
      });
    }

    //Cold Navigations //opening links with "navigate"
    await flow.navigate(HomePage, { //in line 46 - we've defined that flow = lighthouse
      stepName: 'Home Page'
    });
    console.log('Home Page opened');

    await flow.navigate(Tables_Tab, {
        stepName: 'Tables Tab'
    });
    console.log('Tables Tab opened');

    await flow.startTimespan({stepName:'Table product card'});
      await page.waitForSelector('.product-wrap.mb-25 .product-img .default-img');
      await page.click('.product-wrap.mb-25 .product-img .default-img');
      //await waitTillHTMLRendered(page);
    await flow.endTimespan();
    console.log('Table product card opened');

    await flow.startTimespan({stepName:'Add table to Cart'});
      await page.waitForSelector('.pro-details-cart.btn-hover');
      await page.click('.pro-details-cart.btn-hover');
      //await waitTillHTMLRendered(page);
      await page.waitForSelector('button.icon-cart i[class="pe-7s-shopbag"]');
    await flow.endTimespan();
    console.log('Add table to Cart');

    await flow.startTimespan({stepName:'Open Cart'});
      await page.waitForSelector('button.icon-cart i[class="pe-7s-shopbag"]');
      await sleep(100);
      await page.click('button.icon-cart i[class="pe-7s-shopbag"]');
      //await waitTillHTMLRendered(page);
      await page.waitForSelector('div.shopping-cart-content.active');
      await page.waitForSelector('a.default-btn[href="/cart"]');
      await sleep(100);
      await page.click('a.default-btn[href="/cart"]');
      await waitTillHTMLRendered(page);
    await flow.endTimespan();
    console.log('Open Cart');

    await flow.startTimespan({stepName:'Proceed to Checkout'});
      await page.waitForSelector('a[href="/checkout"]',{visible: true});
      await sleep(100);
      await page.click('a[href="/checkout"]');
      await waitTillHTMLRendered(page);
      await page.waitForSelector('.billing-info-wrap',{visible: true});
    await flow.endTimespan();
    console.log('Proceed_to_Checkout');


 const reportPath = './shopizer.report.html'; //folder for html report
 const reportPathJson = './shopizer.report.json'; //folder for json report

 const report = await flow.generateReport();
 const reportJson = JSON.stringify(await flow.createFlowResult(), null, 2)
 //const reportJson = JSON.stringify(flow.getFlowResult()).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029'); //taken from GitHub

 fs.writeFileSync(reportPath, report); //write html report
 fs.writeFileSync(reportPathJson, reportJson); //write json report

 await browser.close(); //close Chrome
}
captureReport(); //call function