const puppeteer = require('puppeteer');

async function checkMetadata(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  
  // Get all meta tags
  const metaTags = await page.evaluate(() => {
    const tags = {};
    const metaElements = document.querySelectorAll('meta');
    
    metaElements.forEach(meta => {
      const name = meta.getAttribute('name') || meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (name && content) {
        tags[name] = content;
      }
    });
    
    // Also get title
    tags.title = document.title;
    
    return tags;
  });
  
  console.log('Metadata found:', JSON.stringify(metaTags, null, 2));
  
  await browser.close();
}

checkMetadata('https://fit-rapids-glow-leonard.trycloudflare.com/').catch(console.error);
