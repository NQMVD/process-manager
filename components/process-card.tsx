import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { ProcessOutput } from "./process-output";
import { ProcessActions } from "./process-actions";
import { CommandDisplay } from "./command-display";

interface Process {
  id: string;
  name: string;
  command: string;
  status:
    | "running"
    | "completed"
    | "killed"
    | "failed"
    | "paused"
    | "queued"
    | "stashed";
  duration: string;
  exitCode: number | null;
  output: string;
}

interface ProcessCardProps {
  process: Process;
}

export function ProcessCard({ process }: ProcessCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
      case "completed":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "failed":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20";
      case "queued":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
      case "stashed":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      case "killed":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
    }
  };

  const handleActionComplete = () => {
    // This would trigger a refresh of the process data
    console.log(`Action completed for process ${process.id}`);
    // In a real app, this would call a refresh function or trigger a re-fetch
  };

  return (
    <Card className="bg-gradient-to-b from-[oklch(0.15250_0_0)] to-[oklch(0.15250_0_0)] border-solid border-border border w-full py-3.5">
      <CardHeader className="mx-0 my-0 py-0 mb-[-16px] px-3.5">
        <div className="flex items-start justify-between gap-2 my-0 py-0">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-foreground text-balance pr-0 mr-2 border-none border-0">
              {process.name}
            </h3>
          </div>
          <Badge className={getStatusColor(process.status)}>
            {process.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 my-0 px-3.5">
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium py-0">
            Command
          </p>
          <CommandDisplay command={process.command} />
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{process.duration}</span>
          </div>
          {process.exitCode !== null && (
            <div className="text-muted-foreground">
              Exit:{" "}
              <span
                className={
                  process.exitCode === 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {process.exitCode}
              </span>
            </div>
          )}
        </div>

        <ProcessOutput
          output={process.output}
          processId={process.id}
          isRunning={process.status === "running"}
        />

        <ProcessActions
          processId={process.id}
          status={process.status}
          onActionComplete={handleActionComplete}
        />
      </CardContent>
    </Card>
  );
}
