const fs = require('fs')
const url = require('url')
const path = require('path')
const Apify = require('apify')
const minifyHTML = require('html-minifier').minify
const createXMLDoc = require('xmlbuilder2').create
const {enqueueLinks, requestAsBrowser, log} = Apify.utils

module.exports = function(argv) {
  const config = require('../config')(argv)

  log.setLevel(log.LEVELS.ERROR);

  Apify.main(async () => {
    const nowiso = (new Date(Date.now())).toISOString()

    let supportedLocales = []
    if (fs.existsSync('translations')) {
      supportedLocales = fs.readdirSync('translations')
        .filter(f => path.extname(f) == '.po' && f != 'messages.po')
        .map(f => path.basename(f, path.extname(f)))
        .map(l => l.replace('_', '-').toLowerCase())
    }
    const routesByLocale = {'default': {
      urlset: {
        '@xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
        'url': []
      }
    }}
    if (supportedLocales.length > 0) supportedLocales.map(l => routesByLocale[l] = {
      urlset: {
        '@xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
        'url': []
      }
    })

    const requestQueue = await Apify.openRequestQueue()
    await requestQueue.addRequest({ url: `http://localhost${config.get('port')}` })

    const handlePageFunction = async ({page, request}) => {
      console.log(`Crawling ${request.url}`)
      const html = await page.content();
      const {pathname} = new url.URL(request.url)
      const savepath = path.join('build/static', pathname)
      fs.mkdirSync(savepath, {recursive: true})
      const savefilepath = path.join(savepath, 'index.html')
      const minified = minifyHTML(html, {collapseWhitespace: true, removeComments: true})
      fs.writeFileSync(savefilepath, minified)
      console.log('💾 Saved: ',savefilepath)

      const possibleLocales = [pathname.slice(1, 6), pathname.slice(1, 3)]
      const locale = supportedLocales.indexOf(possibleLocales[0]) !== -1
        ? possibleLocales[0]
        : supportedLocales.indexOf(possibleLocales[1]) !== -1
          ? possibleLocales[1]
          : 'default'
      routesByLocale[locale].urlset.url.push({
        loc: config.get('produrl') + pathname,
        lastmod: nowiso
      })

      const enqueued = await enqueueLinks({
        page,
        requestQueue,
        pseudoUrls: [`http://localhost${config.get('port')}[.*]`],
      })
      console.log(`Enqueued ${enqueued.length} URLs.`)
    }

    const crawler = new Apify.PuppeteerCrawler({
      maxRequestsPerCrawl: 10,
      requestQueue,
      handlePageFunction
    })

    await crawler.run()

    const finished = await requestQueue.isFinished()
    if (finished === true) {
      const xmlDocAttrs = {encoding: 'UTF-8', version: '1.0'}
      const list = Object.keys(routesByLocale)
      for (var i = 0; i < list.length; i++) {
        const locale = list[i]
        const xmlstr = createXMLDoc(xmlDocAttrs, routesByLocale[locale]).end({prettyPrint: true})
        fs.writeFileSync(
          path.join('build/static', locale == 'default' ? '' : locale, 'sitemap.xml'),
          xmlstr)
      }
    }
  })
}
