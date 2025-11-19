"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommandDisplayProps {
  command: string;
}

export function CommandDisplay({ command }: CommandDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy command:", err);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="dark:bg-muted/30 rounded-md p-3 font-mono text-sm break-all border bg-[rgba(19,19,19,1)] flex-1">
        <code className="text-foreground">{command}</code>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={copyCommand}
        className="h-9 w-9 flex-shrink-0 bg-background/80 hover:bg-background mx-0 my-0 px-0 py-0 rounded-md"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-600" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
