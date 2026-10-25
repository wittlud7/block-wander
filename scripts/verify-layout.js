async(page)=>{
  await page.reload();const results=[];
  for(const width of [320,390,720,768,1024,1440]){await page.setViewportSize({width,height:900});const b=await page.locator('#board').boundingBox();if(Math.abs(b.height/b.width-2)>.06)throw new Error('distorted board at '+width);if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw new Error('overflow '+width);results.push({width,boardRatio:Math.round(b.height/b.width*100)/100});}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'output/playwright/v2-mobile-final.png',fullPage:true});await page.setViewportSize({width:1440,height:1080});return {layouts:results};
}
