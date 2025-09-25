"use client"

import useSWR from "swr"
import { pueueAPI, type PueueProcess } from "@/lib/pueue-api"

const fetcher = async () => {
  const status = await pueueAPI.getStatus()
  return Object.values(status.processes)
}

export function useProcesses() {
  const { data, error, isLoading, mutate } = useSWR<PueueProcess[]>("processes", fetcher, {
    refreshInterval: 2000, // Refresh every 2 seconds for real-time updates
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  return {
    processes: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

export function useProcessOutput(processId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    processId ? `process-output-${processId}` : null,
    () => pueueAPI.getProcessOutput(processId),
    {
      refreshInterval: 1000, // Refresh output every second for running processes
      revalidateOnFocus: true,
    },
  )

  return {
    output: data || "",
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
