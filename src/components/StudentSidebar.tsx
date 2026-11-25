"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Squares2X2Icon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

export type StudentNavTab = "dashboard" | "status" | "profile";

interface StudentSidebarProps {
  activeTab: StudentNavTab;
  onTabChange: (tab: StudentNavTab) => void;
  onSignOutClick: () => void;
  applicationNumber?: string;
  studentName?: string;
  studentPhoto?: string;
}

export default function StudentSidebar({
  activeTab,
  onTabChange,
  onSignOutClick,
  applicationNumber = "MF-2025-001",
  studentName = "Student",
  studentPhoto = "",
}: StudentSidebarProps) {
  const navItems = [
    {
      id: "dashboard" as StudentNavTab,
      label: "DASHBOARD",
      icon: Squares2X2Icon,
      description: "Application Dashboard",
    },
  ];

  return (
    <aside className="w-[72px] bg-white text-black shrink-0 flex flex-col justify-between border-r border-black/15 sticky top-0 h-dvh select-none z-30">
      {/* Top Branding Section & Nav */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top App Logo Box */}
        <div className="h-16 border-b border-black/15 flex items-center justify-center p-2 shrink-0">
          <button
            type="button"
            onClick={() => onTabChange("dashboard")}
            className="flex items-center justify-center transition-transform cursor-pointer focus:outline-none"
            title="Maatram Foundation"
          >
            <Image
              src="/assets/images/logo.png"
              alt="Maatram"
              width={40}
              height={40}
              priority
              className="w-9 h-9 object-contain"
            />
          </button>
        </div>

        {/* Vertical Icon + Subtitle Navigation List */}
        <nav className="py-2 overflow-y-auto flex-1 flex flex-col items-center gap-1 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            const activeBg = "bg-brand/15";
            const activeText = "text-black";
            const activeBar = "bg-brand";

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`group relative w-full flex flex-col items-center justify-center py-2.5 px-1 transition-colors cursor-pointer focus:outline-none ${
                  isActive
                    ? `${activeBg} ${activeText}`
                    : "text-black hover:text-black hover:bg-black/5"
                }`}
                title={item.description}
              >
                {/* Active Right Indicator Bar */}
                {isActive && (
                  <span className={`absolute right-0 top-0 bottom-0 w-[3px] ${activeBar} rounded-l`} />
                )}

                {/* Icon */}
                <Icon
                  className={`w-5 h-5 stroke-[1.8] transition-transform duration-200 ${
                    isActive ? activeText : "text-black"
                  }`}
                />

                {/* All-Caps Label Underneath */}
                <span
                  className={`text-[10px] font-primary font-semibold mt-1 text-center leading-tight line-clamp-1 max-w-[68px] ${
                    isActive ? `${activeText} font-bold` : "text-black"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Profile Button (close to Signout) & Sign Out Button */}
      <div className="border-t border-black/15 flex flex-col items-center py-2 shrink-0 gap-1">
        {/* Profile Nav Item (Close to Sign Out) */}
        <button
          type="button"
          onClick={() => onTabChange("profile")}
          className={`group relative w-full flex flex-col items-center justify-center py-2 px-1 transition-colors cursor-pointer focus:outline-none ${
            activeTab === "profile"
              ? "bg-brand/15 text-black"
              : "text-black hover:text-black hover:bg-black/5"
          }`}
          title={`Profile - Signed in as ${studentName} (${applicationNumber})`}
        >
          {activeTab === "profile" && (
            <span className="absolute right-0 top-0 bottom-0 w-[3px] bg-brand rounded-l" />
          )}

          {studentPhoto ? (
            <div className={`w-6 h-6 rounded-full overflow-hidden border transition-transform duration-200 ${
              activeTab === "profile" ? "border-brand ring-2 ring-brand/40" : "border-black/15"
            }`}>
              <img
                src={studentPhoto}
                alt={studentName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <UserCircleIcon
              className={`w-5 h-5 stroke-[1.8] transition-transform duration-200 ${
                activeTab === "profile" ? "text-black" : "text-black"
              }`}
            />
          )}

          <span
            className={`text-[10px] font-primary font-semibold mt-1 text-center leading-tight ${
              activeTab === "profile" ? "text-black font-bold" : "text-black"
            }`}
          >
            PROFILE
          </span>
        </button>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={onSignOutClick}
          className="group w-full flex flex-col items-center justify-center py-2 px-1 text-black/65 hover:text-black hover:bg-brand/15 transition cursor-pointer"
          title="Sign Out"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4 stroke-[2] text-black group-hover:text-black transition-transform duration-200" />
          <span className="text-[10px] font-primary font-semibold mt-1 text-center text-black group-hover:text-black">
            SIGNOUT
          </span>
        </button>
      </div>
    </aside>
  );
}
