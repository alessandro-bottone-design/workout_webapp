// Quick smoke check: does the dev server render without JS errors?
import puppeteer from 'puppeteer-core'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const URL = process.argv[2] || 'http://127.0.0.1:5173/'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage']
})
const page = await browser.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', async (m) => {
  if (m.type() !== 'error') return
  try {
    const parts = await Promise.all(
      m.args().map(async (a) => {
        const v = await a.evaluate((x) =>
          x instanceof Error
            ? `${x.name}: ${x.message}\n${x.stack ?? ''}`
            : typeof x === 'object'
              ? JSON.stringify(x)
              : String(x)
        )
        return v
      })
    )
    errors.push(`console.error: ${parts.join(' ') || m.text()}`)
  } catch {
    errors.push(`console.error: ${m.text()}`)
  }
})
page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`))

const resp = await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 })
await new Promise((r) => setTimeout(r, 2000))

const info = await page.evaluate(() => ({
  title: document.title,
  rootChildren: document.getElementById('root')?.childElementCount ?? -1,
  text: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300)
}))

await page.screenshot({ path: 'qa-output/preview-check.png', fullPage: false })

console.log(JSON.stringify({ status: resp?.status(), ...info, errors: errors.slice(0, 20) }, null, 2))
await browser.close()
