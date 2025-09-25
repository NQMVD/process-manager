import { Activity, Server } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { ProcessStats } from "./process-stats";
import { useIsMobile } from "./ui/use-mobile";

interface Process {
  id: string;
  name: string;
  command: string;
  status: "running" | "completed" | "killed" | "failed" | "paused" | "queued";
  duration: string;
  exitCode: number | null;
  output: string;
}

interface HeaderProps {
  processes?: Process[];
}

export function Header({ processes = [] }: HeaderProps) {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Server className="h-6 w-6 text-primary" />
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                Process Manager
              </h1>
              <p className="text-sm text-muted-foreground">
                Pueue Task Runner Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {useIsMobile() ? null : <ProcessStats processes={processes} />}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
