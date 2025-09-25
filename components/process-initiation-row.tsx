"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Play, Plus, Zap } from "lucide-react";
import { useNotificationContext } from "./notification-provider";

const commonCommands = [
  {
    name: "Python Script",
    command: "python script.py",
    description: "Run Python script",
  },
  {
    name: "Node Server",
    command: "npm start",
    description: "Start Node.js server",
  },
  {
    name: "Build Project",
    command: "npm run build",
    description: "Build the project",
  },
  { name: "Run Tests", command: "npm test", description: "Execute test suite" },
  {
    name: "Docker Build",
    command: "docker build -t app .",
    description: "Build Docker image",
  },
  {
    name: "Git Pull",
    command: "git pull origin main",
    description: "Pull latest changes",
  },
];

export function ProcessInitiationRow() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customCommand, setCustomCommand] = useState("");
  const [customName, setCustomName] = useState("");
  const { addNotification } = useNotificationContext();

  const handleStartProcess = (
    command: string,
    name: string,
    enqueue = false,
  ) => {
    // This would call the pueue API to start/enqueue the process
    console.log(
      `${enqueue ? "Enqueuing" : "Starting"} process: ${name} - ${command}`,
    );

    addNotification({
      type: "success",
      message: `Process "${name}" ${enqueue ? "enqueued" : "started"} successfully`,
    });

    // Clear custom inputs after starting
    if (name === customName) {
      setCustomCommand("");
      setCustomName("");
    }
  };

  const handleCustomStart = (enqueue = false) => {
    if (!customCommand.trim()) {
      addNotification({
        type: "error",
        message: "Please enter a command",
      });
      return;
    }

    const name = customName.trim() || customCommand.split(" ")[0];
    handleStartProcess(customCommand, name, enqueue);
  };

  return (
    <Card className="w-full bg-card border-border mx-0 my-1 py-3 px-3">
      <div className="p-3 py-0 px-0">
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between text-sm font-medium hover:bg-gradient-to-b hover:from-[oklch(0.18750_0_0)] hover:to-[oklch(0.19750_0_0)]"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Start New Process
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {isExpanded && (
          <CardContent className="p-0 pt-3 space-y-4">
            {/* Custom Command Input */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Process name (optional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="flex-1 border border-dashed border-border"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter custom command..."
                  value={customCommand}
                  onChange={(e) => setCustomCommand(e.target.value)}
                  className="flex-1 font-mono text-sm border border-border"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleCustomStart(false);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => handleCustomStart(false)}
                  disabled={!customCommand.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Start
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCustomStart(true)}
                  disabled={!customCommand.trim()}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Enqueue
                </Button>
              </div>
            </div>

            {/* Common Commands */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quick Start
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {commonCommands.map((cmd, index) => (
                  <Card
                    key={index}
                    className="p-2 bg-muted/30 hover:bg-gradient-to-b hover:from-[oklch(0.18250_0_0)] hover:to-[oklch(0.18750_0_0)] transition-colors px-3 py-2.5 border-dashed shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h5 className="text-xs font-medium text-foreground">
                          {cmd.name}
                        </h5>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {cmd.command}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cmd.description}
                      </p>
                      <div className="flex gap-1 pt-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs bg-transparent py-3 px-2 font-normal border-l-0 border-r-0 border-t border-b border-border border-solid"
                          onClick={() =>
                            handleStartProcess(cmd.command, cmd.name, false)
                          }
                        >
                          <Play className="h-2 w-2 mr-0" />
                          Start
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-xs px-2 font-normal py-3 border-0 border-solid border-border bg-transparent border-l-0 border-r-0 border-t border-b"
                          onClick={() =>
                            handleStartProcess(cmd.command, cmd.name, true)
                          }
                        >
                          <Plus className="h-2 w-2 mr-0" />
                          Queue
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </div>
    </Card>
  );
}
