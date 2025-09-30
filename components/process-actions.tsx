"use client";

import { Button } from "@/components/ui/button";
import { Play, Square, RotateCcw, Pause, Loader2, StopCircle } from "lucide-react";
import { useProcessActions } from "@/hooks/use-process-actions";
import { useNotificationContext } from "./notification-provider";

interface ProcessActionsProps {
  processId: string;
  status:
    | "running"
    | "completed"
    | "killed"
    | "failed"
    | "paused"
    | "queued"
    | "stashed";
  onActionComplete?: () => void;
}

export function ProcessActions({
  processId,
  status,
  onActionComplete,
}: ProcessActionsProps) {
  const { executeAction, loading } = useProcessActions();
  const { addNotification } = useNotificationContext();

  const handleAction = async (actionType: string) => {
    try {
      await executeAction({ type: actionType as any, processId });
      addNotification({
        type: "success",
        message: `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} completed successfully`,
      });
      onActionComplete?.();
    } catch (error) {
      addNotification({
        type: "error",
        message: `Failed to ${actionType} process`,
      });
    }
  };

  const isLoading = loading === processId;

  const renderActionButtons = () => {
    switch (status) {
      case "running":
        return (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-card px-0 py-0 hover:bg-gradient-to-b hover:from-[oklch(0.18750_0_0)] hover:to-[oklch(0.20250_0_0)] font-normal"
              onClick={() => handleAction("pause")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Pause className="h-3 w-3 mr-1" />
              )}
              Pause
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-card px-0 py-0 hover:bg-gradient-to-b hover:from-[oklch(0.18750_0_0)] hover:to-[oklch(0.20250_0_0)] font-normal"
              onClick={() => handleAction("stop")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Square className="h-3 w-3 mr-1" />
              )}
              Stop
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-card px-0 py-0 hover:bg-gradient-to-b hover:from-[oklch(0.18750_0_0)] hover:to-[oklch(0.20250_0_0)] font-normal"
              onClick={() => handleAction("terminate")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <StopCircle className="h-3 w-3 mr-1" />
              )}
              Terminate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-card px-0 py-0 hover:bg-gradient-to-b hover:from-[oklch(0.18750_0_0)] hover:to-[oklch(0.20250_0_0)] font-normal"
              onClick={() => handleAction("restart")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3 mr-1" />
              )}
              Restart
            </Button>
          </>
        );
      case "paused":
        return (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-card px-0 py-0 hover:bg-gradient-to-b hover:from-[oklch(0.18750_0_0)] hover:to-[oklch(0.20250_0_0)] font-normal"
              onClick={() => handleAction("resume")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              Resume
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 bg-card px-0 py-0 hover:bg-gradient-to-b hover:from-[oklch(0.18750_0_0)] hover:to-[oklch(0.20250_0_0)] font-normal"
              onClick={() => handleAction("kill")}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Square className="h-3 w-3 mr-1" />
              )}
              Kill
            </Button>
          </>
        );
      case "failed":
      case "completed":
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-card px-0 py-0 hover:bg-gradient-to-b hover:from-[oklch(0.18750_0_0)] hover:to-[oklch(0.20250_0_0)] font-normal"
            onClick={() => handleAction("restart")}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <RotateCcw className="h-3 w-3 mr-1" />
            )}
            Restart
          </Button>
        );
      case "queued":
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-8 bg-card px-0 py-0 hover:bg-gradient-to-b hover:from-[oklch(0.18750_0_0)] hover:to-[oklch(0.20250_0_0)] font-normal"
            onClick={() => handleAction("cancel")}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Square className="h-3 w-3 mr-1" />
            )}
            Cancel
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-2 flex-wrap font-normal">
      {renderActionButtons()}
    </div>
  );
}
