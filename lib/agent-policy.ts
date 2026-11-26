import type { AgentAction } from '@ui-sdk/react/agent'

export function allowAgentAction(step: AgentAction, pathname: string): boolean {
  if (step.confirm !== undefined) return false

  const routineList = pathname === '/routines'
  const workspace =
    routineList ||
    pathname === '/freestyle' ||
    /^\/routine\/[^/]+$/.test(pathname)
  if (
    step.component === 'button' &&
    step.action === 'press' &&
    step.args.length === 0
  ) {
    if (pathname === '/')
      return step.label === 'Get Started' || step.label === 'Start Timing Now'
    return (
      workspace &&
      (step.label === 'Freestyle' ||
        step.label === 'Routines' ||
        (routineList && step.label === 'Add Routine'))
    )
  }

  if (
    routineList &&
    step.component === 'input' &&
    (step.label === 'Search routines' || step.label === 'Routine name')
  ) {
    return (
      (step.action === 'focus' && step.args.length === 0) ||
      (step.action === 'setValue' &&
        step.args.length === 1 &&
        typeof step.args[0] === 'string')
    )
  }
  return false
}
