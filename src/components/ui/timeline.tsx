"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
} from "motion/react";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div
      className="w-full font-sans md:px-10"
      ref={containerRef}
    >
      <div ref={ref} className="relative mx-auto max-w-4xl pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:gap-10 md:pt-32"
          >
            {/* Sticky step number on the left */}
            <div className="sticky top-40 z-40 flex max-w-xs items-center self-start md:w-full lg:max-w-sm">
              <div className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(201,168,76,0.2)] bg-[#0A0A0A]">
                <div className="h-4 w-4 rounded-full border border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.15)]" />
              </div>
              <h3 className="hidden font-cormorant text-5xl font-bold text-[rgba(201,168,76,0.3)] md:block md:pl-20">
                {item.title}
              </h3>
            </div>

            {/* Content on the right */}
            <div className="relative w-full pl-20 pr-4 md:pl-4">
              <h3 className="mb-4 block font-cormorant text-2xl font-bold text-[rgba(201,168,76,0.4)] md:hidden">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* The scroll beam line */}
        <div
          style={{ height: height + "px" }}
          className="absolute left-8 top-0 w-[2px] overflow-hidden bg-gradient-to-b from-transparent via-[rgba(201,168,76,0.15)] to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)] md:left-8"
        >
          <motion.div
            style={{
              height: heightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-[#C9A84C] via-[#E8D48B] to-transparent"
          />
        </div>
      </div>
    </div>
  );
};
