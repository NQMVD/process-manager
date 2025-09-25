"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, Copy, Download, X } from "lucide-react";
import { useState } from "react";

interface FullScreenOutputProps {
  isOpen: boolean;
  onClose: () => void;
  processName: string;
  output: string;
  processId: string;
}

export function FullScreenOutput({
  isOpen,
  onClose,
  processName,
  output,
  processId,
}: FullScreenOutputProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy output:", error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${processName.replace(/\s+/g, "_")}_output.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] bg-slate-950 border-slate-800">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-green-400" />
            <DialogTitle className="text-green-400 font-mono">
              {processName} - Output
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-slate-400 hover:text-green-400"
            >
              <Copy className="h-4 w-4 mr-1" />
              {isCopied ? "Copied!" : "Copy"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-slate-400 hover:text-green-400"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-slate-400 hover:text-red-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-slate-900 rounded border border-slate-800 overflow-hidden">
          <pre className="h-full p-4 text-sm text-green-300 font-mono whitespace-pre-wrap break-words overflow-auto">
            {output || "No output available"}
          </pre>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
          <span>Process ID: {processId}</span>
          <span>
            {output.split("\n").length} lines • {new Blob([output]).size} bytes
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
