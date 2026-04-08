"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
  }: {
    card: { title: string; src: string };
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "relative overflow-hidden rounded-xl h-60 md:h-80 w-full transition-all duration-300 ease-out cursor-none border border-[rgba(255,255,255,0.05)]",
        hovered !== null && hovered !== index && "blur-sm scale-[0.98] opacity-60"
      )}
    >
      <img
        src={card.src}
        alt={card.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500"
        style={{
          transform: hovered === index ? "scale(1.05)" : "scale(1)",
        }}
      />
      <div
        className={cn(
          "absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 transition-opacity duration-300",
          hovered === index ? "opacity-100" : "opacity-0"
        )}
      >
        <span className="text-[10px] font-semibold tracking-[3px] text-[rgba(245,245,240,0.85)]">
          {card.title}
        </span>
      </div>
    </div>
  )
);

Card.displayName = "Card";

type CardType = {
  title: string;
  src: string;
};

export function FocusCards({ cards }: { cards: CardType[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-2 gap-3 md:grid-cols-4 md:px-8">
      {cards.map((card, index) => (
        <Card
          key={card.title}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
        />
      ))}
    </div>
  );
}
