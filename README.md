# Snapscreen

When you call `snapshot(name)` it will take a screenshot at that point and store it under `./screenshots/actual`, it will compare it to the corresponding file under `./screenshots/expected` and return the number of pixels difference. If the difference is non-zero, a `${name}-diff.png` file will also be created highlighting the different pixels. 

The expected/actual folders are automatically created if they don't exist. If there isn't a corresponding expected file (e.g. on first run), it will automatically be created too - i.e. there is zero set up.

To force update a screenshot on subsequent runs you can set the environment variable `SNAPSHOTS` equal to the screenshot name, or set it to `true` to overwrite all the expected screenshots. 

```js
const { test } = require('tap')
    , { startup } = require('./start-application')
    
test('home-page', async ({ plan, same }) => {
  plan(2)
  const { page, destroy } = await startup()
      , snapshot = await require('snapscreen')(page)

  await page.waitFor('.content')

  same(await snapshot('home-page'), 0)

  await page.click('.more')

  same(await snapshot('home-page-2'), 0)

  await destroy()
})
```

## Additional Options

```js
const snapshot = await require('snapscreen')(page, { 
  width = 1920
, height = 1200
, dir = dirname(module.parent.filename) 
})

snapshot(name, { 
  update = process.env.SNAPSHOTS == 'true' || process.env.SNAPSHOTS == name
, fullPage = false
, threshold = 0.5
, scrollX = 0
, scrollY = 0
})
```

* `width`/`height`: set the width/height of the screenshots
* `dir`: the base directory where the `screenshots` will be created, defaults to where the module is called from
* `update`: overwrite the expected file with the actual file, defaults to true if the environment variable `SNAPSHOTS` is set to `true` or the name of the screenshot.
* `fullPage`: take a full page screenshot rather than cropping to specific width/height
* `scrollX`/`scrollY`: scroll to this position before taking the screenshot