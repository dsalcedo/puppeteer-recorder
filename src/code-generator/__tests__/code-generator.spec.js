import CodeGenerator from '../CodeGenerator'

describe('code-generator', () => {
  test('it should generate nothing when there are no events', () => {
    const events = []
    const codeGenerator = new CodeGenerator()
    expect(codeGenerator._parseEvents(events)).toBeFalsy()
  })

  test('it generates a page.select() only for select dropdowns', () => {
    const events = [{ action: 'change', selector: 'select#animals', tagName: 'SELECT', value: 'hamster' }]
    const codeGenerator = new CodeGenerator()
    expect(codeGenerator._parseEvents(events)).toContain("await page.select('select#animals', 'hamster')")
  })

  test('it generates the correct waitForNavigation code', () => {
    const events = [{ action: 'navigation*' }, { action: 'click', selector: 'a.link' }]
    const codeGenerator = new CodeGenerator()
    expect(codeGenerator._parseEvents(events)).toContain('const navigationPromise = page.waitForNavigation()\n')
    expect(codeGenerator._parseEvents(events)).toContain('await navigationPromise\n')
  })

  test('it does not generate waitForNavigation code when turned off', () => {
    const events = [{ action: 'navigation*' }, { action: 'click', selector: 'a.link' }]
    const codeGenerator = new CodeGenerator({ waitForNavigation: false })
    expect(codeGenerator._parseEvents(events)).not.toContain('const navigationPromise = page.waitForNavigation()\n')
    expect(codeGenerator._parseEvents(events)).not.toContain('await navigationPromise\n')
  })

  test('it generates the correct waitForSelector code before clicks', () => {
    const events = [{ action: 'click', selector: 'a.link' }]
    const codeGenerator = new CodeGenerator()
    const result = codeGenerator._parseEvents(events)

    expect(result).toContain("await page.waitForSelector('a.link')")
    expect(result).toContain("await page.click('a.link')")
  })

  test('it does not generate the waitForSelector code before clicks when turned off', () => {
    const events = [{ action: 'click', selector: 'a.link' }]
    const codeGenerator = new CodeGenerator({ waitForSelectorOnClick: false })
    const result = codeGenerator._parseEvents(events)

    expect(result).not.toContain("await page.waitForSelector('a.link')")
    expect(result).toContain("await page.click('a.link')")
  })

  test('it uses the default page frame when events originate from frame 0', () => {
    const events = [{ action: 'click', selector: 'a.link', frameId: 0, frameUrl: 'https://some.site.com' }]
    const codeGenerator = new CodeGenerator()
    const result = codeGenerator._parseEvents(events)
    expect(result).toContain("await page.click('a.link')")
  })

  test('it uses a different frame when events originate from an iframe', () => {
    const events = [{ action: 'click', selector: 'a.link', frameId: 123, frameUrl: 'https://some.iframe.com' }]
    const codeGenerator = new CodeGenerator()
    const result = codeGenerator._parseEvents(events)
    expect(result).toContain("await frame_123.click('a.link')")
  })

  test('it adds a frame selection preamble when events originate from an iframe', () => {
    const events = [{ action: 'click', selector: 'a.link', frameId: 123, frameUrl: 'https://some.iframe.com' }]
    const codeGenerator = new CodeGenerator()
    const result = codeGenerator._parseEvents(events)
    expect(result).toContain('let frames = await page.frames()')
    expect(result).toContain("const frame_123 = frames.find(f => f.url() === 'https://some.iframe.com'")
  })
})
