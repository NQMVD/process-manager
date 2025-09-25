"use client"

import { useState, useCallback } from "react"

export interface Notification {
  id: string
  message: string
  type: "success" | "error" | "info" | "warning"
  duration?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }

    setNotifications((prev) => [...prev, newNotification])

    // Auto remove after duration (default 4 seconds)
    const duration = notification.duration || 4000
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, duration)

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
  }
}
