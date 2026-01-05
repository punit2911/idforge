import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChallengeVerificationProps {
  onVerified: (token: string) => void;
  onInvalidated: () => void;
  className?: string;
}

function generateChallenge() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const timestamp = Date.now();
  return { a, b, answer: a + b, timestamp };
}

function createToken(a: number, b: number, answer: number, timestamp: number): string {
  // Simple token: base64 encoded challenge data with timestamp
  const data = `${a}:${b}:${answer}:${timestamp}`;
  return btoa(data);
}

export function ChallengeVerification({ 
  onVerified, 
  onInvalidated,
  className 
}: ChallengeVerificationProps) {
  const [challenge, setChallenge] = useState(() => generateChallenge());
  const [userAnswer, setUserAnswer] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState(false);
  // Honeypot field - bots will fill this, humans won't see it
  const [honeypot, setHoneypot] = useState("");

  const refreshChallenge = useCallback(() => {
    setChallenge(generateChallenge());
    setUserAnswer("");
    setIsVerified(false);
    setError(false);
    onInvalidated();
  }, [onInvalidated]);

  // Refresh challenge every 2 minutes for security
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isVerified) {
        refreshChallenge();
      }
    }, 120000);
    return () => clearInterval(interval);
  }, [isVerified, refreshChallenge]);

  const handleVerify = () => {
    // Check honeypot - if filled, silently fail (bot detected)
    if (honeypot) {
      setError(true);
      return;
    }

    const parsed = parseInt(userAnswer, 10);
    if (parsed === challenge.answer) {
      setIsVerified(true);
      setError(false);
      const token = createToken(challenge.a, challenge.b, challenge.answer, challenge.timestamp);
      onVerified(token);
    } else {
      setError(true);
      setIsVerified(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVerify();
    }
  };

  return (
    <div className={cn("space-y-3 p-4 rounded-lg border border-border bg-card/50", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Quick verification</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshChallenge}
          className="h-8 w-8 p-0"
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-lg font-mono bg-muted px-3 py-2 rounded-md">
          <span>{challenge.a}</span>
          <span>+</span>
          <span>{challenge.b}</span>
          <span>=</span>
        </div>
        
        <Input
          type="number"
          value={userAnswer}
          onChange={(e) => {
            setUserAnswer(e.target.value);
            setError(false);
            if (isVerified) {
              setIsVerified(false);
              onInvalidated();
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="?"
          className={cn(
            "w-20 text-center font-mono text-lg",
            isVerified && "border-green-500 bg-green-500/10",
            error && "border-destructive bg-destructive/10"
          )}
          disabled={isVerified}
        />
        
        {!isVerified ? (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleVerify}
            type="button"
            disabled={!userAnswer}
          >
            Verify
          </Button>
        ) : (
          <div className="flex items-center gap-1 text-green-500">
            <Check className="h-5 w-5" />
            <span className="text-sm font-medium">Verified</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Incorrect answer. Please try again.</span>
        </div>
      )}

      {/* Honeypot field - invisible to users, bots will fill it */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        style={{
          position: "absolute",
          left: "-9999px",
          opacity: 0,
          height: 0,
          width: 0,
        }}
        aria-hidden="true"
      />
    </div>
  );
}
