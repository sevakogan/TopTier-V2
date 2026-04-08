"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

export const TextHoverEffect = ({
  text,
  duration,
  textLines,
}: {
  text?: string;
  duration?: number;
  automatic?: boolean;
  textLines?: string[];
}) => {
  const lines = textLines ?? (text ? [text] : []);
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (svgRef.current && cursor.x !== null && cursor.y !== null) {
      const svgRect = svgRef.current.getBoundingClientRect();
      const cxPercentage = ((cursor.x - svgRect.left) / svgRect.width) * 100;
      const cyPercentage = ((cursor.y - svgRect.top) / svgRect.height) * 100;
      setMaskPosition({
        cx: `${cxPercentage}%`,
        cy: `${cyPercentage}%`,
      });
    }
  }, [cursor]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox={lines.length > 1 ? "0 0 300 120" : "0 0 300 100"}
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className="select-none"
    >
      <defs>
        <linearGradient
          id="textGradient"
          gradientUnits="userSpaceOnUse"
          cx="50%"
          cy="50%"
          r="25%"
        >
          {hovered && (
            <>
              <stop offset="0%" stopColor="#C9A84C" />
              <stop offset="30%" stopColor="#E8D48B" />
              <stop offset="60%" stopColor="#C9A84C" />
              <stop offset="100%" stopColor="#A88B3A" />
            </>
          )}
        </linearGradient>

        <motion.radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}

          // example for a smoother animation below

          //   transition={{
          //     type: "spring",
          //     stiffness: 300,
          //     damping: 50,
          //   }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id="textMask">
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#revealMask)"
          />
        </mask>
      </defs>
      {/* Ghost stroke layer */}
      {lines.map((line, i) => (
        <text
          key={`ghost-${i}`}
          x="50%"
          y={lines.length === 1 ? "50%" : `${35 + i * 35}%`}
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="0.3"
          className="fill-transparent stroke-[rgba(245,245,240,0.15)] font-[helvetica] text-7xl font-bold"
          style={{ opacity: hovered ? 0.7 : 0 }}
        >
          {line}
        </text>
      ))}
      {/* Animated stroke layer */}
      {lines.map((line, i) => (
        <motion.text
          key={`stroke-${i}`}
          x="50%"
          y={lines.length === 1 ? "50%" : `${35 + i * 35}%`}
          textAnchor="middle"
          dominantBaseline="middle"
          strokeWidth="0.3"
          className="fill-transparent stroke-[rgba(245,245,240,0.15)] font-[helvetica] text-7xl font-bold"
          initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
          animate={{ strokeDashoffset: 0, strokeDasharray: 1000 }}
          transition={{ duration: 4, ease: "easeInOut", delay: i * 0.3 }}
        >
          {line}
        </motion.text>
      ))}
      {/* Gradient reveal layer */}
      {lines.map((line, i) => (
        <text
          key={`gradient-${i}`}
          x="50%"
          y={lines.length === 1 ? "50%" : `${35 + i * 35}%`}
          textAnchor="middle"
          dominantBaseline="middle"
          stroke="url(#textGradient)"
          strokeWidth="0.3"
          mask="url(#textMask)"
          className="fill-transparent font-[helvetica] text-7xl font-bold"
        >
          {line}
        </text>
      ))}
    </svg>
  );
};
