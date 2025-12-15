"use client";

import { useEffect, useMemo } from "react";
import { Users, Loader2, Crown, User } from "lucide-react";
import { useParticipants } from "@/hooks/useSecretSanta";
import { useAccount } from "wagmi";

interface ParticipantsListProps {
  gameId: bigint;
  creatorAddress: `0x${string}`;
}

// Deterministic shuffle based on gameId (consistent across renders but hides order)
const shuffleArray = <T,>(array: T[], seed: bigint): T[] => {
  const shuffled = [...array];
  let seedNum = Number(seed % BigInt(2147483647));
  for (let i = shuffled.length - 1; i > 0; i--) {
    seedNum = (seedNum * 1103515245 + 12345) % 2147483647;
    const j = seedNum % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const ParticipantsList = ({ gameId, creatorAddress }: ParticipantsListProps) => {
  const { address: currentUser } = useAccount();
  const { participants, isLoading, error, fetchParticipants } = useParticipants(gameId);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Shuffle participants for display (hides join order)
  const shuffledParticipants = useMemo(() => {
    return shuffleArray(participants, gameId);
  }, [participants, gameId]);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="p-4 bg-base-200 border border-base-300 rounded-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-bold font-display uppercase tracking-wide text-base-content">
          Participants ({participants.length})
        </h4>
      </div>

      {isLoading ? (
        <div className="py-4 text-center">
          <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : participants.length === 0 ? (
        <p className="text-sm text-base-content/60">No participants yet</p>
      ) : (
        <div className="space-y-2">
          {shuffledParticipants.map((participant) => {
            const isCreator = participant.toLowerCase() === creatorAddress.toLowerCase();
            const isCurrentUser = participant.toLowerCase() === currentUser?.toLowerCase();

            return (
              <div
                key={participant}
                className={`flex items-center justify-between p-2 rounded-sm ${
                  isCurrentUser ? "bg-primary/10 border border-primary/30" : "bg-base-100"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-base-300 flex items-center justify-center">
                    <User className="w-3 h-3 text-base-content/50" />
                  </div>
                  <span className="font-mono text-sm text-base-content">
                    {truncateAddress(participant)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isCreator && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-sm">
                      <Crown className="w-3 h-3 text-primary" />
                      <span className="text-xs text-primary font-pixel">CREATOR</span>
                    </div>
                  )}
                  {isCurrentUser && (
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary/10 rounded-sm">
                      <User className="w-3 h-3 text-secondary" />
                      <span className="text-xs text-secondary font-pixel">YOU</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
