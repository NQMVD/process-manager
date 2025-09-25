// Pueue API integration utilities
// NOTE: Real interaction with the pueue daemon now happens in server route handlers
// using the helper in lib/pueue-exec.ts. This client wrapper only talks to those
// API endpoints (/api/status, /api/processes/:id/output, /api/processes/action) and
// still provides a mock fallback if the server call fails (e.g. pueue isn't installed
// in the current environment). This preserves the UI while enabling real data when
// available. Avoid using this file directly in edge runtimes that restrict process
// execution; keep all binary interaction on the server layer.
export interface PueueProcess {
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
  startTime?: string;
  endTime?: string;
  group?: string;
}

export interface PueueStatus {
  processes: Record<string, PueueProcess>;
  groups: Record<string, any>;
  settings: any;
}

export class PueueAPI {
  private baseUrl: string;

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  async getStatus(): Promise<PueueStatus> {
    try {
      const response = await fetch(`/api/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch pueue status:", error);
      // Return mock data for development
      return this.getMockStatus();
    }
  }

  async getProcessOutput(processId: string): Promise<string> {
    try {
      const response = await fetch(`/api/processes/${processId}/output`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.output;
    } catch (error) {
      console.error(`Failed to fetch output for process ${processId}:`, error);
      return "Failed to fetch output";
    }
  }

  async executeAction(action: string, processId: string): Promise<any> {
    try {
      const response = await fetch(`/api/processes/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: action, processId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(
        `Failed to execute ${action} on process ${processId}:`,
        error,
      );
      throw error;
    }
  }

  private getMockStatus(): PueueStatus {
    return {
      processes: {
        "1": {
          id: "1",
          name: "Web Server",
          command: "python -m http.server 8080",
          status: "running",
          duration: "2h 34m",
          exitCode: null,
          output:
            'Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...\n127.0.0.1 - - [24/Sep/2025 10:30:15] "GET / HTTP/1.1" 200 -',
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          group: "default",
        },
        "2": {
          id: "2",
          name: "Database Backup",
          command: "pg_dump -h localhost -U postgres mydb > backup.sql",
          status: "completed",
          duration: "45s",
          exitCode: 0,
          output:
            "pg_dump: last built-in OID is 16383\npg_dump: reading extensions\npg_dump: identifying extension members\npg_dump: reading schemas",
          startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 9 * 60 * 1000).toISOString(),
          group: "default",
        },
        "3": {
          id: "3",
          name: "Log Processor",
          command: "tail -f /var/log/nginx/access.log | grep ERROR",
          status: "failed",
          duration: "12m",
          exitCode: 1,
          output:
            "tail: cannot open '/var/log/nginx/access.log' for reading: Permission denied",
          startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
          group: "default",
        },
        "4": {
          id: "4",
          name: "System Monitor",
          command: 'watch -n 5 "df -h && free -h"',
          status: "paused",
          duration: "1h 23m",
          exitCode: null,
          output:
            "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        20G  8.5G   11G  45% /",
          startTime: new Date(Date.now() - 83 * 60 * 1000).toISOString(),
          group: "default",
        },
      },
      groups: {
        default: {
          status: "running",
          parallel_tasks: 1,
        },
      },
      settings: {
        daemon: {
          default_parallel_tasks: 1,
          pause_group_on_failure: false,
          pause_all_on_failure: false,
        },
      },
    };
  }
}

export const pueueAPI = new PueueAPI();
