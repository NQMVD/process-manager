"use client"

import { useState } from "react"
import { pueueAPI } from "@/lib/pueue-api"

export interface ProcessAction {
  type: "start" | "stop" | "restart" | "kill" | "pause" | "resume" | "cancel" | "terminate"
  processId: string
}

export function useProcessActions() {
  const [loading, setLoading] = useState<string | null>(null)

  const executeAction = async (action: ProcessAction) => {
    setLoading(action.processId)

    try {
      const result = await pueueAPI.executeAction(action.type, action.processId)

      // Simulate API delay for demo
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return result
    } catch (error) {
      console.error(`Error ${action.type}ing process:`, error)
      throw error
    } finally {
      setLoading(null)
    }
  }

  return {
    executeAction,
    loading,
  }
}
