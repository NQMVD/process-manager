"use client";

import { X, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Notification } from "@/hooks/use-notifications";

interface NotificationContainerProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

export function NotificationContainer({
  notifications,
  onRemove,
}: NotificationContainerProps) {
  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return (
          <CheckCircle className="h-4 w-4 text-green-50 dark:text-white" />
        );
      case "error":
        return <XCircle className="h-4 w-4 text-red-50 dark:text-white" />;
      case "warning":
        return (
          <AlertTriangle className="h-4 w-4 text-yellow-50 dark:text-white" />
        );
      case "info":
        return <Info className="h-4 w-4 text-blue-50 dark:text-white" />;
    }
  };

  const getNotificationColors = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-600 text-white dark:bg-green-500 dark:text-white border border-green-700/50 dark:border-green-400/30";
      case "error":
        return "bg-red-600 text-white dark:bg-red-500 dark:text-white border border-red-700/50 dark:border-red-400/30";
      case "warning":
        return "bg-yellow-500 text-black dark:bg-yellow-400 dark:text-black border border-yellow-600/40 dark:border-yellow-300/40";
      case "info":
        return "bg-blue-600 text-white dark:bg-blue-500 dark:text-white border border-blue-700/50 dark:border-blue-400/30";
      default:
        return "bg-muted text-foreground border border-border";
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-3 shadow-lg rounded-md ring-1 ring-black/10 dark:ring-white/10 animate-in slide-in-from-right-full duration-200 ${getNotificationColors(notification.type)}`}
        >
          <div className="flex items-start gap-2">
            {getNotificationIcon(notification.type)}
            <p className="text-sm flex-1">{notification.message}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => onRemove(notification.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
