'use client'

import { useEffect } from 'react'
import { createAgent, registerTools } from '@ui-sdk/react/agent'
import { allowAgentAction } from '@/lib/agent-policy'

const agent = typeof window === 'undefined' ? null : createAgent()

export function AgentBridge() {
  useEffect(() => {
    if (agent)
      return registerTools(agent, {
        allow: (step) => allowAgentAction(step, window.location.pathname),
      })
  }, [])
  return null
}
