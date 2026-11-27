import { allowAgentAction } from '@/lib/agent-policy'
import type { AgentAction } from '@ui-sdk/react/agent'

const edit: AgentAction = {
  ref: 'c1',
  component: 'input',
  label: 'Search routines',
  action: 'setValue',
  args: ['Soup'],
}
const navigate: AgentAction = {
  ref: 'c2',
  component: 'button',
  label: 'Freestyle',
  action: 'press',
  args: [],
}

it('permits routine search, draft edits and named navigation', () => {
  expect(allowAgentAction(edit, '/routines')).toBe(true)
  expect(
    allowAgentAction({ ...edit, label: 'Routine name' }, '/routines'),
  ).toBe(true)
  expect(allowAgentAction(navigate, '/routine/123')).toBe(true)
})

it('refuses confirmed actions, extra arguments, unknown controls and sensitive routes', () => {
  for (const step of [
    { ...edit, confirm: '' },
    { ...edit, args: [1] },
    { ...edit, args: ['a', 'b'] },
    { ...navigate, args: ['Delete'] },
    { ...edit, component: 'textarea' },
  ]) {
    expect(allowAgentAction(step, '/routines')).toBe(false)
  }
  for (const label of [
    'Delete',
    'Pay',
    'Sign out',
    'Save',
    'Toggle theme',
    'Freestyle settings',
  ]) {
    expect(allowAgentAction({ ...navigate, label }, '/routines')).toBe(false)
  }
  for (const path of [
    '/sign-in',
    '/sign-up',
    '/settings',
    '/account',
    '/routine/123/settings',
  ]) {
    expect(allowAgentAction(edit, path)).toBe(false)
    expect(allowAgentAction(navigate, path)).toBe(false)
  }
})

it('denies presses on reorder handles', () => {
  expect(
    allowAgentAction({ ...navigate, label: 'Reorder Timer 1' }, '/freestyle'),
  ).toBe(false)
})
