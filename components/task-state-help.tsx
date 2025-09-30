"use client";

import { useState } from "react";
import { HelpCircle, ArrowRight, Play, Square, Pause, RotateCcw, X, Archive } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TaskState {
  name: string;
  key: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

interface StateTransition {
  from: string;
  to: string;
  action: string;
  description: string;
}

const taskStates: TaskState[] = [
  {
    name: "Queued",
    key: "queued",
    description: "Task is waiting in the queue to be executed",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    icon: <div className="w-2 h-2 rounded-full bg-gray-500" />,
  },
  {
    name: "Running",
    key: "running", 
    description: "Task is currently being executed",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    icon: <Play className="w-3 h-3 text-green-600" />,
  },
  {
    name: "Paused",
    key: "paused",
    description: "Task execution has been temporarily stopped",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    icon: <Pause className="w-3 h-3 text-yellow-600" />,
  },
  {
    name: "Stashed",
    key: "stashed",
    description: "Task removed from queue but can be restored",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    icon: <Archive className="w-3 h-3 text-purple-600" />,
  },
  {
    name: "Completed",
    key: "completed",
    description: "Task finished successfully with exit code 0",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    icon: <div className="w-2 h-2 rounded-full bg-blue-500" />,
  },
  {
    name: "Failed", 
    key: "failed",
    description: "Task finished with a non-zero exit code",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: <X className="w-3 h-3 text-red-600" />,
  },
  {
    name: "Killed",
    key: "killed",
    description: "Task was forcefully terminated before completion",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    icon: <Square className="w-3 h-3 text-red-600" />,
  },
];

const stateTransitions: StateTransition[] = [
  // From queued
  { from: "queued", to: "running", action: "start/resume", description: "Automatically when resources available or manually started" },
  { from: "queued", to: "paused", action: "pause", description: "Pause before execution begins" },
  { from: "queued", to: "stashed", action: "stash", description: "Remove from queue temporarily" },
  { from: "queued", to: "killed", action: "kill", description: "Terminate queued task" },
  
  // From running
  { from: "running", to: "completed", action: "finish", description: "Process exits with code 0" },
  { from: "running", to: "failed", action: "finish", description: "Process exits with non-zero code" },
  { from: "running", to: "killed", action: "kill", description: "Forcefully terminate running process" },
  { from: "running", to: "paused", action: "pause", description: "Temporarily stop execution" },
  
  // From paused
  { from: "paused", to: "running", action: "start/resume", description: "Resume execution" },
  { from: "paused", to: "killed", action: "kill", description: "Terminate paused task" },
  { from: "paused", to: "stashed", action: "stash", description: "Move to stash" },
  
  // From stashed
  { from: "stashed", to: "queued", action: "enqueue", description: "Restore to queue" },
  { from: "stashed", to: "killed", action: "remove", description: "Permanently remove task" },
  
  // From terminal states (via restart)
  { from: "completed", to: "queued", action: "restart", description: "Create new task with same command" },
  { from: "failed", to: "queued", action: "restart", description: "Create new task with same command" },
  { from: "killed", to: "queued", action: "restart", description: "Create new task with same command" },
];

interface TaskStateHelpProps {
  trigger?: React.ReactNode;
}

export function TaskStateHelp({ trigger }: TaskStateHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getTransitionsFrom = (stateKey: string) => {
    return stateTransitions.filter(t => t.from === stateKey);
  };

  const getStateByKey = (key: string) => {
    return taskStates.find(s => s.key === key);
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
      <HelpCircle className="h-4 w-4 mr-1" />
      Help
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Task States & Transitions
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* States Overview */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Task States</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {taskStates.map((state) => (
                <div key={state.key} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 mt-0.5">
                    {state.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={state.color}>
                        {state.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {state.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* State Transitions */}
          <div>
            <h3 className="text-lg font-semibold mb-3">State Transitions</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This diagram shows how tasks move between different states and what actions trigger each transition.
            </p>
            
            <div className="space-y-4">
              {taskStates.map((state) => {
                const transitions = getTransitionsFrom(state.key);
                if (transitions.length === 0) return null;

                return (
                  <div key={state.key} className="border rounded-lg p-4 bg-card">
                    <div className="flex items-center gap-2 mb-3">
                      {state.icon}
                      <Badge variant="secondary" className={state.color}>
                        {state.name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">can transition to:</span>
                    </div>
                    
                    <div className="space-y-2 ml-6">
                      {transitions.map((transition, index) => {
                        const targetState = getStateByKey(transition.to);
                        if (!targetState) return null;

                        return (
                          <div key={index} className="flex items-center gap-3 text-sm">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              {targetState.icon}
                              <Badge variant="outline" className={targetState.color}>
                                {targetState.name}
                              </Badge>
                            </div>
                            <span className="text-muted-foreground">via</span>
                            <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                              {transition.action}
                            </code>
                            <span className="text-xs text-muted-foreground">
                              - {transition.description}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Action Summary */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Available Actions</h3>
            <div className="grid gap-2 md:grid-cols-2 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Play className="h-3 w-3 text-green-600" />
                  <code className="font-mono">start/resume</code>
                  <span className="text-muted-foreground">- Begin or continue execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <Pause className="h-3 w-3 text-yellow-600" />
                  <code className="font-mono">pause</code>
                  <span className="text-muted-foreground">- Temporarily stop execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <Square className="h-3 w-3 text-red-600" />
                  <code className="font-mono">kill</code>
                  <span className="text-muted-foreground">- Forcefully terminate task</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-3 w-3 text-blue-600" />
                  <code className="font-mono">restart</code>
                  <span className="text-muted-foreground">- Create new task with same command</span>
                </div>
                <div className="flex items-center gap-2">
                  <Archive className="h-3 w-3 text-purple-600" />
                  <code className="font-mono">stash</code>
                  <span className="text-muted-foreground">- Remove from queue (restorable)</span>
                </div>
                <div className="flex items-center gap-2">
                  <X className="h-3 w-3 text-red-600" />
                  <code className="font-mono">remove</code>
                  <span className="text-muted-foreground">- Permanently delete task</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}