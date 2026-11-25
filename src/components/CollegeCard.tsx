"use client";

import React from "react";
import Image from "next/image";
import { BuildingLibraryIcon } from "@heroicons/react/24/outline";

export interface CollegeCardData {
  id: string;
  name: string;
  imageSrc?: string;
  logoBg?: string;
  logoText?: string;
}

interface CollegeCardProps {
  college: CollegeCardData;
  onClick?: (college: CollegeCardData) => void;
}

export default function CollegeCard({ college, onClick }: CollegeCardProps) {
  return (
    <div
      onClick={() => onClick?.(college)}
      className="group bg-white rounded-xl border border-black/15 hover:shadow-sm hover:border-brand/60 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-6 text-center min-h-[290px] sm:min-h-[320px]"
    >
      {/* Circle Shape Image Container */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-brand/60 shadow-sm transition-transform duration-300 shrink-0 flex items-center justify-center bg-black/5">
        {college.imageSrc ? (
          <Image
            src={college.imageSrc}
            alt={college.name}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-2"
            style={{ backgroundColor: college.logoBg || "#000000", color: ["#FFFFFF", "#F7BC0F"].includes(college.logoBg || "") ? "#000000" : "#FFFFFF" }}
          >
            <BuildingLibraryIcon className="w-10 h-10 stroke-[1.8]" />
            {college.logoText && (
              <span className="font-heading font-bold text-[11px] tracking-wider mt-1">
                {college.logoText}
              </span>
            )}
          </div>
        )}
      </div>

      {/* College Name Only */}
      <div className="mt-6 w-full px-2">
        <h3
          className="font-heading font-bold text-sm sm:text-base text-black group-hover:text-black transition-colors line-clamp-3 leading-snug"
          title={college.name}
        >
          {college.name}
        </h3>
      </div>
    </div>
  );
}
