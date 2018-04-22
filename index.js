const { existsSync, unlinkSync, mkdirSync, copyFileSync, createReadStream, createWriteStream } = require('fs')
    , { values, not } = require('utilise/pure')
    , { resolve, dirname } = require('path')
    , { PNG } = require('pngjs')
    , log = require('utilise/log')('[snapshot]')
    , px = require('pixelmatch')
    , png = path => new Promise(resolve => createReadStream(path).pipe(new PNG()).on('parsed', function(){ resolve(this) }))

module.exports = async (page, { width = 1920, height = 1200, dir = dirname(module.parent.filename) } = {}) => {
  await page.setViewport({ width, height })
  
  return async function snapshot(name, { 
    update    = process.env.SNAPSHOTS == 'true' || process.env.SNAPSHOTS == name
  , fullPage  = false
  , threshold = 0.5
  , scrollX   = 0
  , scrollY   = 0
  } = {}){
    const dirs = {
            screenshots: resolve(dir, './screenshots')
          , actual:      resolve(dir, './screenshots/actual')
          , expected:    resolve(dir, './screenshots/expected')
          }
        , paths = {
            diff:     resolve(dirs.actual, `${name}-diff.png`)
          , actual:   resolve(dirs.actual, `${name}.png`)
          , expected: resolve(dirs.expected, `${name}.png`)
          }

    values(dirs)
      .filter(not(existsSync))
      .map(dir => mkdirSync(dir))

    await page.evaluate(d => scrollTo(scrollX, scrollY))

    if (update || !existsSync(paths.expected)) { 
      await page.screenshot({ path: paths.actual, fullPage })
      copyFileSync(paths.actual, paths.expected)
      existsSync(paths.diff) && unlinkSync(paths.diff)
      return 0
    }

    const pngs = {}
    pngs.expected = existsSync(paths.expected) && await png(paths.expected) 
    height = pngs.expected.height || height
    pngs.diff = new PNG({ width, height })

    await page.screenshot({ path: paths.actual, fullPage })

    pngs.actual = await png(paths.actual)

    const pixels = px(pngs.actual.data, pngs.expected.data, pngs.diff.data, width, height, { threshold })

    log('snapshot diff:'.yellow, name, pixels)
    if (!pixels) {
      existsSync(paths.diff) && unlinkSync(paths.diff)
      return 0
    }

    return new Promise(resolve => pngs
      .diff
      .pack()
      .pipe(createWriteStream(paths.diff))
      .on('finish', d => resolve(pixels))
    )
  }
}