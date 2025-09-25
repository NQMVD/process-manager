"use client";

interface Process {
  id: string;
  name: string;
  command: string;
  status: "running" | "completed" | "killed" | "failed" | "paused" | "queued";
  duration: string;
  exitCode: number | null;
  output: string;
}

interface ProcessStatsProps {
  processes: Process[];
}

export function ProcessStats({ processes }: ProcessStatsProps) {
  const stats = processes.reduce(
    (acc, process) => {
      acc[process.status] = (acc[process.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const statItems = [
    {
      label: "Running",
      count: stats.running || 0,
      color: "text-green-600 dark:text-green-400",
    },
    {
      label: "Completed",
      count: stats.completed || 0,
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Killed",
      count: stats.killed || 0,
      color: "text-red-600 dark:text-red-400",
    },
    {
      label: "Failed",
      count: stats.failed || 0,
      color: "text-red-600 dark:text-red-400",
    },
    {
      label: "Paused",
      count: stats.paused || 0,
      color: "text-yellow-600 dark:text-yellow-400",
    },
    {
      label: "Queued",
      count: stats.queued || 0,
      color: "text-gray-600 dark:text-gray-400",
    },
  ];

  return (
    <div className="flex items-center gap-6">
      {statItems.map((item) => (
        <div key={item.label} className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{item.label}:</span>
          <span className={`text-sm font-medium ${item.color}`}>
            {item.count}
          </span>
        </div>
      ))}
    </div>
  );
}
