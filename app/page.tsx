"use client";

import { ProcessCard } from "@/components/process-card";
import { Header } from "@/components/header";
import { ProcessInitiationRow } from "@/components/process-initiation-row";
import { NotificationProvider } from "@/components/notification-provider";
import { useProcesses } from "@/hooks/use-processes";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Brush,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { PueueProcess } from "@/lib/pueue-api";

export default function Home() {
  const { processes, isLoading, isError, refresh } = useProcesses();
  // Centralized notification hook (was incorrectly used inside handlers)
  // Stub notification function to avoid using context hook outside provider.
  // (Context-based notifications removed here to fix provider usage error.)
  const addNotification = (_: any) => {};

  if (isLoading) {
    return (
      <NotificationProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading processes...</span>
              </div>
            </div>
          </main>
        </div>
      </NotificationProvider>
    );
  }

  if (isError) {
    return (
      <NotificationProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-6">
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load processes</span>
              </div>
              <Button variant="outline" onClick={() => refresh()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </main>
        </div>
      </NotificationProvider>
    );
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-background">
        <Header processes={processes} />
        <main className="container mx-auto px-4 py-6 space-y-6">
          <ProcessInitiationRow />

          <div className="flex items-center justify-between my-4 mt-6">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Active Processes
              </h2>
              <p className="text-muted-foreground">
                {processes.length} processes found
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-stretch">
                {/* Primary action: clear successful tasks (default) */}
                <Button
                  variant="outline"
                  className="rounded-r-none border-r-0"
                  title="Clear successful finished tasks"
                  onClick={async () => {
                    try {
                      const res = await fetch(
                        "/api/processes/clear?mode=successful-only",
                        { method: "POST" },
                      );
                      if (res.ok) {
                        addNotification({
                          type: "success",
                          message: "Cleared successful tasks",
                        });
                        refresh();
                      } else {
                        addNotification({
                          type: "error",
                          message: "Failed to clear successful tasks",
                        });
                      }
                    } catch (e) {
                      console.error("Clear successful tasks failed", e);
                      addNotification({
                        type: "error",
                        message: "Error clearing successful tasks",
                      });
                    }
                  }}
                >
                  <Brush className="h-4 w-4 mr-2" />
                  Clean
                </Button>
                {/* Split dropdown for additional clean options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-l-none px-2"
                      aria-label="More clean options"
                      title="More clean options"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={4}
                    className="w-56 z-[300] bg-popover border border-border shadow-lg rounded-md"
                  >
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            "/api/processes/clear?mode=successful-only",
                            { method: "POST" },
                          );
                          if (res.ok) {
                            addNotification({
                              type: "success",
                              message: "Cleared successful tasks",
                            });
                            refresh();
                            addNotification({
                              type: "info",
                              message: "Process list refreshed",
                            });
                          } else {
                            addNotification({
                              type: "error",
                              message: "Failed to clear successful tasks",
                            });
                          }
                        } catch (e) {
                          console.error("Clear successful tasks failed", e);
                          addNotification({
                            type: "error",
                            message: "Error clearing successful tasks",
                          });
                        }
                      }}
                    >
                      Clear successful
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/processes/clear", {
                            method: "POST",
                          });
                          if (res.ok) {
                            addNotification({
                              type: "success",
                              message: "Cleared all finished tasks",
                            });
                            refresh();
                          } else {
                            addNotification({
                              type: "error",
                              message: "Failed to clear finished tasks",
                            });
                          }
                        } catch (e) {
                          console.error("Clear all finished tasks failed", e);
                          addNotification({
                            type: "error",
                            message: "Error clearing finished tasks",
                          });
                        }
                      }}
                    >
                      Clear all finished
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        refresh();
                        addNotification({
                          type: "info",
                          message: "Process list refreshed",
                        });
                      }}
                    >
                      Refresh now
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Button variant="outline" onClick={() => refresh()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {processes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No processes found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start some tasks with pueue to see them here
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {processes.map((process: PueueProcess) => (
                <ProcessCard key={process.id} process={process} />
              ))}
            </div>
          )}
        </main>
      </div>
    </NotificationProvider>
  );
}
