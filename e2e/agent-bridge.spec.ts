import { expect, test } from '@playwright/test'

type BrowserTool = { name: string; execute(input: object): Promise<unknown> }

declare global {
  interface Window {
    tokeiTools: Map<string, BrowserTool>
  }
}

test('WebMCP redacts auth fields and denies an edit resolved by snapshot ref', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const tools = new Map<string, BrowserTool>()
    window.tokeiTools = tools
    Object.defineProperty(document, 'modelContext', {
      configurable: true,
      value: {
        async registerTool(tool: BrowserTool) {
          tools.set(tool.name, tool)
        },
        async unregisterTool(name: string) {
          tools.delete(name)
        },
      },
    })
  })
  await page.goto('/sign-in')
  await expect.poll(() => page.evaluate(() => window.tokeiTools.size)).toBe(3)
  const email = page.getByLabel('Email', { exact: true })
  await email.fill('private@example.test')
  const snapshot = await page.evaluate(
    async () => await window.tokeiTools.get('snapshot')!.execute({}),
  )
  expect(JSON.stringify(snapshot)).not.toContain('private@example.test')
  expect(JSON.stringify(snapshot)).toContain('[redacted]')
  const entry = (snapshot as { ref: string; label?: string }[]).find(
    (item) => item.label === 'Email',
  )
  expect(entry).toBeDefined()
  const action = await page.evaluate(
    async (ref) =>
      await window.tokeiTools.get('act')!.execute({
        steps: [{ ref, action: 'setValue', args: ['changed@example.test'] }],
      }),
    entry!.ref,
  )
  expect(action).toMatchObject({ ok: false })
  await expect(email).toHaveValue('private@example.test')
})
