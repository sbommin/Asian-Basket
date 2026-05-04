// ============================================================
// CREATE NEW FILE: src/components/EircodeInput.tsx
// Drop-in Eircode autofill field for the Checkout form
// ============================================================

import { useState } from "react";
import { Search, CheckCircle, AlertCircle, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  lookupEircode,
  isValidEircodeFormat,
  normaliseEircode,
  EircodeResult,
} from "@/lib/eircodeUtils";

/* ─── Props ──────────────────────────────────────────────────────────────── */

interface EircodeInputProps {
  /** Called when a successful lookup fills the address fields */
  onAddressFilled: (result: EircodeResult) => void;
  /** Optional: pre-populate the field */
  defaultValue?: string;
  /** Disable when a saved address is selected */
  disabled?: boolean;
}

/* ─── Component ───────────────────────────────────────────────────────────── */

const EircodeInput = ({ onAddressFilled, defaultValue = "", disabled = false }: EircodeInputProps) => {
  const [eircode, setEircode]   = useState(defaultValue);
  const [status, setStatus]     = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage]   = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow letters, digits and spaces only — max 8 chars (with space)
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "").slice(0, 8);
    setEircode(val);
    // Auto-insert space after first 3 chars for UX
    if (val.replace(/\s/g, "").length === 3 && !val.includes(" ")) {
      setEircode(val + " ");
    }
    setStatus("idle");
    setMessage("");
  };

  const handleLookup = async () => {
    const trimmed = eircode.trim();

    if (!trimmed) {
      setStatus("error");
      setMessage("Please enter an Eircode.");
      return;
    }

    if (!isValidEircodeFormat(trimmed)) {
      setStatus("error");
      setMessage("Invalid Eircode format. Example: D01 F5P2");
      return;
    }

    setStatus("loading");
    setMessage("");

    const result = await lookupEircode(trimmed);

    if (result.found) {
      setStatus("success");
      setMessage("Address found! Fields have been filled in.");
      onAddressFilled(result);
    } else {
      setStatus("error");
      setMessage(result.error || "Eircode not found. Please enter address manually.");
      // Still pass the zipCode back so it's populated even on failure
      onAddressFilled({ ...result, zipCode: normaliseEircode(trimmed).slice(0, 3) + " " + normaliseEircode(trimmed).slice(3) });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLookup();
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-1">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        Eircode
        <span className="text-xs text-muted-foreground ml-1">(auto-fills address)</span>
      </Label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            value={eircode}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. D01 F5P2"
            disabled={disabled || status === "loading"}
            className={`h-11 text-base font-mono uppercase pr-8 ${
              status === "success" ? "border-green-400 focus-visible:ring-green-400" :
              status === "error"   ? "border-red-400   focus-visible:ring-red-400"   : ""
            }`}
            maxLength={8}
          />
          {/* Status icon inside input */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {status === "loading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {status === "success" && <CheckCircle className="h-4 w-4 text-green-500" />}
            {status === "error"   && <AlertCircle className="h-4 w-4 text-red-500" />}
          </div>
        </div>

        <Button
          type="button"
          onClick={handleLookup}
          disabled={disabled || status === "loading" || !eircode.trim()}
          className="h-11 px-4 flex-shrink-0"
          variant="outline"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <><Search className="h-4 w-4 mr-1.5" /> Find</>
          )}
        </Button>
      </div>

      {/* Status message */}
      {message && (
        <p className={`text-xs flex items-center gap-1 ${
          status === "success" ? "text-green-600" : "text-red-500"
        }`}>
          {status === "success"
            ? <CheckCircle className="h-3 w-3" />
            : <AlertCircle className="h-3 w-3" />}
          {message}
        </p>
      )}

      {status === "idle" && (
        <p className="text-xs text-muted-foreground">
          Enter your Eircode and click <strong>Find</strong> to auto-fill your address.
        </p>
      )}
    </div>
  );
};

export default EircodeInput;
