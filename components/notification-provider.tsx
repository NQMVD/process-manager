"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import { NotificationContainer } from "./notification-container";

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, "id">) => string;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { notifications, addNotification, removeNotification } =
    useNotifications();

  return (
    <NotificationContext.Provider
      value={{ addNotification, removeNotification }}
    >
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider",
    );
  }
  return context;
}
