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
    <div className="group relative">
      <div className="dark:bg-muted/30 rounded-md p-3 font-mono text-sm break-all border bg-[rgba(19,19,19,1)]">
        <code className="text-foreground">{command}</code>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={copyCommand}
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background mx-0 my-0 px-0 py-0 mt-[3px] rounded-md"
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
