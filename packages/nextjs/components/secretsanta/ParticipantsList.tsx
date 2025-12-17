"use client";

import { useEffect, useMemo } from "react";
import { Users, Loader2, Crown, User } from "lucide-react";
import { useParticipantsWithNames, ParticipantWithName } from "@/hooks/useSecretSanta";
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
  const { participants, isLoading, error, fetchParticipantsWithNames } = useParticipantsWithNames(gameId);

  useEffect(() => {
    fetchParticipantsWithNames();
  }, [fetchParticipantsWithNames]);

  // Shuffle participants for display (hides join order)
  const shuffledParticipants = useMemo(() => {
    return shuffleArray(participants, gameId);
  }, [participants, gameId]);

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="bg-white p-4 pb-8 rounded-sm shadow-polaroid transform -rotate-1 hover:rotate-0 transition-transform duration-300">
      <div className="bg-pastel-mint rounded-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-santa-deepRed" />
          <h4 className="text-sm font-bold font-display text-santa-deepRed">
            Participants ({participants.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="py-4 text-center">
            <Loader2 className="w-5 h-5 text-fhenix-purple/40 animate-spin mx-auto" />
          </div>
        ) : error ? (
          <p className="text-sm text-pastel-coral">{error}</p>
        ) : participants.length === 0 ? (
          <p className="text-sm text-santa-deepRed/60">No participants yet</p>
        ) : (
          <div className="space-y-2">
            {shuffledParticipants.map((participant) => {
              const isCreator = participant.address.toLowerCase() === creatorAddress.toLowerCase();
              const isCurrentUser = participant.address.toLowerCase() === currentUser?.toLowerCase();

              return (
                <div
                  key={participant.address}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    isCurrentUser ? "bg-fhenix-purple/10 border border-fhenix-purple/30" : "bg-white/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-santa-deepRed/10 flex items-center justify-center">
                      <User className="w-3 h-3 text-santa-deepRed" />
                    </div>
                    <div className="flex flex-col">
                      {participant.name ? (
                        <>
                          <span className="text-sm font-medium text-santa-deepRed">
                            {participant.name}
                          </span>
                          <span className="font-mono text-xs text-santa-deepRed/50">
                            {truncateAddress(participant.address)}
                          </span>
                        </>
                      ) : (
                        <span className="font-mono text-sm text-santa-deepRed">
                          {truncateAddress(participant.address)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCreator && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-pastel-coral/30 rounded-lg">
                        <Crown className="w-3 h-3 text-santa-deepRed" />
                        <span className="text-xs text-santa-deepRed font-medium">Creator</span>
                      </div>
                    )}
                    {isCurrentUser && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-fhenix-purple/20 rounded-lg">
                        <User className="w-3 h-3 text-fhenix-purple" />
                        <span className="text-xs text-fhenix-purple font-medium">You</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
