"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Terminal,
  Maximize2,
  Minimize2,
  Copy,
  RotateCcw,
  Trash2,
  Loader2,
} from "lucide-react";

/**
 * Props
 */
interface ProcessOutputProps {
  output: string;
  processId: string;
  isRunning?: boolean;
}

/**
 * A terminal-style output panel with:
 * - Live EventSource streaming for running tasks
 * - Manual refresh
 * - Clear successful tasks button (pueue clear --successful-only)
 * - Fallback fetch of output for completed (non-live) tasks
 * - Copy, expand, auto-scroll, and basic status indicators
 */
export function ProcessOutput({
  output,
  processId,
  isRunning = false,
}: ProcessOutputProps) {
  // UI state
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Streaming state
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<
    "idle" | "connecting" | "open" | "error" | "closed"
  >("idle");
  const [streamingBuffer, setStreamingBuffer] = useState("");

  // Fallback output (for non-running tasks or when live disabled)
  const [fallbackOutput, setFallbackOutput] = useState<string>("");
  const [loadingFallback, setLoadingFallback] = useState(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);

  // Clearing state
  const [isClearing, setIsClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);
  const clearTimerRef = useRef<NodeJS.Timeout | null>(null);

  const outputRef = useRef<HTMLPreElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Compose displayed output in priority order
  const displayedOutput =
    (isRunning && liveEnabled && streamingBuffer) ||
    fallbackOutput ||
    output ||
    "";

  // ---------- Helpers ----------

  const formatOutput = useCallback((text: string) => {
    if (!text) return "No output available";
    // Strip ANSI color escapes (basic)
    return text.replace(/\x1b\[[0-9;]*m/g, "");
  }, []);

  const scrollToBottom = () => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  // ---------- Copy ----------

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedOutput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1800);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  // ---------- Manual Refresh (non-live) ----------

  const fetchFallbackOutput = useCallback(
    async (reason: string = "manual") => {
      // Only fetch if not currently streaming live output
      if (isRunning && liveEnabled) return;
      setLoadingFallback(true);
      setFallbackError(null);
      try {
        const res = await fetch(
          `/api/processes/${processId}/output?lines=400&reason=${reason}`,
          {
            cache: "no-store",
          },
        );
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setFallbackOutput(data.output || "");
      } catch (err) {
        setFallbackError(
          err instanceof Error ? err.message : "Unknown error fetching output",
        );
      } finally {
        setLoadingFallback(false);
      }
    },
    [isRunning, liveEnabled, processId],
  );

  const handleRefresh = () => {
    fetchFallbackOutput("refresh_button");
  };

  // Fetch once on mount (or when transitioning to completed) if no output
  useEffect(() => {
    if (!isRunning && !liveEnabled && !fallbackOutput && !output) {
      fetchFallbackOutput("initial");
    }
  }, [
    isRunning,
    liveEnabled,
    fallbackOutput,
    output,
    fetchFallbackOutput,
    processId,
  ]);

  // When a task stops running, disable live (optional) and get final output
  useEffect(() => {
    if (!isRunning && liveEnabled) {
      // Keep the buffer but also capture final output snapshot
      fetchFallbackOutput("stopped");
      // Optionally leave live enabled to keep historical buffer
      // setLiveEnabled(false);
    }
  }, [isRunning, liveEnabled, fetchFallbackOutput]);

  // ---------- Live Streaming via SSE ----------

  useEffect(() => {
    if (!isRunning || !liveEnabled) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
        setConnectionStatus("closed");
      }
      return;
    }

    setConnectionStatus("connecting");
    const es = new EventSource(
      `/api/processes/${processId}/stream?interval=1000&lines=400`,
    );
    eventSourceRef.current = es;
    let buffer = "";

    es.onopen = () => setConnectionStatus("open");
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data.full) {
          buffer = data.append || "";
        } else if (data.append) {
          buffer += data.append;
        }
        setStreamingBuffer(buffer);
      } catch {
        // Fallback: treat as raw text line
        if (ev.data) {
          buffer += ev.data + "\n";
          setStreamingBuffer(buffer);
        }
      }
    };
    es.addEventListener("reset", () => {
      buffer = "";
    });
    es.onerror = () => {
      setConnectionStatus("error");
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isRunning, liveEnabled, processId]);

  // ---------- Auto Scroll ----------

  useEffect(() => {
    if (autoScroll) scrollToBottom();
  }, [displayedOutput, autoScroll]);

  // ---------- Clear Successful Tasks ----------

  // Clear ONLY the local terminal buffer (does NOT modify pueue tasks)
  const handleClearSuccessful = () => {
    setIsClearing(true);
    setStreamingBuffer("");
    setFallbackOutput("");
    setClearMessage("Cleared terminal");
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      setClearMessage(null);
      setIsClearing(false);
    }, 1200);
  };

  useEffect(
    () => () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    },
    [],
  );

  // ---------- UI Fragments ----------

  const statusBadge = () => {
    if (!isRunning) return null;
    return (
      <div className="flex gap-1 items-center justify-start my-0 bg-muted rounded-sm py-px px-[5px] mx-0.5">
        <div className="w-2 h-2 rounded-full animate-pulse bg-emerald-400 dark:bg-emerald-400 border-0" />
        <span className="text-xs text-emerald-500 dark:text-emerald-400  font-mono">
          Live
        </span>
      </div>
    );
  };

  const connectionBadge = () => {
    if (!isRunning) return null;
    if (connectionStatus === "open") return null;
    let text = connectionStatus;

    if (connectionStatus === "error") text = "error";
    if (connectionStatus === "closed") text = "closed";
    if (connectionStatus === "idle") text = "idle";
    return (
      <span className="ml-1 text-[10px] font-mono text-muted-foreground">
        [{text}]
      </span>
    );
  };

  // ---------- Render ----------

  return (
    <Card className="dark:bg-muted/50 border-border overflow-hidden py-1 px-1 rounded-lg bg-[rgba(19,19,19,1)]">
      <div className="p-2 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex gap-1 justify-start items-center">
            <Terminal className="h-3 w-3 text-emerald-400 dark:text-green-400 mt-[3px]" />
            <span className="text-xs font-mono text-emerald-400 dark:text-green-400">
              Output
            </span>
            {statusBadge()}
            {connectionBadge()}
            {fallbackError && (
              <span className="ml-2 text-[10px] text-red-500">
                {fallbackError}
              </span>
            )}
            {clearMessage && (
              <span className="ml-2 text-[10px] text-muted-foreground">
                {clearMessage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Refresh (manual fetch for non-live) */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
              onClick={handleRefresh}
              title="Refresh output (manual snapshot)"
              disabled={loadingFallback || (isRunning && liveEnabled)}
            >
              {loadingFallback ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
            </Button>
            {/* Clear successful tasks */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
              onClick={handleClearSuccessful}
              title="Clear terminal output"
              disabled={isClearing}
            >
              {isClearing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
            </Button>
            {/* Live toggle (only when running) */}
            {isRunning && (
              <Button
                variant="ghost"
                size="sm"
                className={`h-6 px-2 text-[10px] font-mono ${
                  liveEnabled
                    ? "text-emerald-500 dark:text-emerald-400"
                    : "text-muted-foreground"
                }`}
                onClick={() => setLiveEnabled((v) => !v)}
                title={
                  liveEnabled
                    ? `Disable live stream (status: ${connectionStatus})`
                    : "Enable live stream"
                }
              >
                {liveEnabled ? "LIVE" : "OFF"}
              </Button>
            )}
            {/* Copy */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
              onClick={handleCopy}
              title={isCopied ? "Copied!" : "Copy output"}
              disabled={!displayedOutput}
            >
              <Copy className="h-3 w-3" />
            </Button>
            {/* Expand */}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
              onClick={() => setIsExpanded((v) => !v)}
              title={isExpanded ? "Minimize" : "Expand"}
            >
              {isExpanded ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        <div className="bg-background border border-border rounded-md relative overflow-hidden">
          <pre
            ref={outputRef}
            className={`text-xs font-mono whitespace-pre-wrap break-words p-2 overflow-y-auto transition-all duration-200 text-muted-foreground ${
              isExpanded ? "max-h-96" : "max-h-24"
            }`}
            onScroll={(e) => {
              const el = e.currentTarget;
              const isAtBottom =
                el.scrollHeight - el.scrollTop === el.clientHeight;
              setAutoScroll(isAtBottom);
            }}
          >
            {formatOutput(displayedOutput)}
          </pre>

          {/* Scroll indicator */}
          {!autoScroll && (
            <div className="absolute bottom-2 right-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs bg-muted/80 text-emerald-600 dark:text-emerald-400 hover:bg-muted"
                onClick={() => {
                  scrollToBottom();
                  setAutoScroll(true);
                }}
              >
                ↓ New output
              </Button>
            </div>
          )}

          {/* Non-live loading overlay */}
          {loadingFallback && !isRunning && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading output…</span>
              </div>
            </div>
          )}

          {/* Empty placeholder */}
          {!displayedOutput && !loadingFallback && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground">
                No output yet
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
