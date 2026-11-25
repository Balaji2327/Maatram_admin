"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  PencilSquareIcon,
  TrashIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

export interface EventCardData {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  targetAudience?: string;
  imageUrl?: string;
  status?: "upcoming" | "completed" | "cancelled";
  // Volunteer specific attributes
  mode?: "remote" | "offline";
  studentVolunteersNeeded?: number;
  alumniVolunteersNeeded?: number;
  taskToComplete?: string;
  duration?: string;
  startTime?: string;
  endTime?: string;
  eligibleYears?: string[];
  acceptedStudents?: any[];
  acceptedAlumni?: any[];
  rejectedParticipants?: string[];
  volunteerAssignments?: Record<string, any[]>;
}

interface EventCardProps {
  event: EventCardData;
  onView?: (event: EventCardData) => void;
  onEdit?: (event: EventCardData) => void;
  onDelete?: (event: EventCardData) => void;
  onApproveAssignment?: (eventId: string, volunteerEmail: string) => void;
  onViewAssignments?: (event: EventCardData, volunteer: any) => void;
  isApprovingAssignment?: boolean;
  approvingEmail?: string;
}

export default function EventCard({
  event,
  onView,
  onEdit,
  onDelete,
  onApproveAssignment,
  onViewAssignments,
  isApprovingAssignment = false,
  approvingEmail = "",
}: EventCardProps) {
  const [isAcceptedModalOpen, setIsAcceptedModalOpen] = useState(false);

  const isRemote = event.mode === "remote";
  const sAccepted = event.acceptedStudents?.length || 0;
  const sNeeded = event.studentVolunteersNeeded || 0;
  const aAccepted = event.acceptedAlumni?.length || 0;
  const aNeeded = event.alumniVolunteersNeeded || 0;
  const allAccepted = [
    ...(event.acceptedStudents || []).map((s: any) => ({ ...s, volunteerRole: "Student" })),
    ...(event.acceptedAlumni || []).map((a: any) => ({ ...a, volunteerRole: "Alumni" })),
  ];
  const totalAccepted = allAccepted.length;

  return (
    <div className="group @container min-w-0 bg-white rounded-lg border border-black/15 hover:shadow-sm transition-shadow flex flex-col justify-between overflow-hidden">
      <div onClick={() => onView?.(event)} className="cursor-pointer">
        <header className="space-y-4 border-b border-brand/35 bg-brand/10 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-black">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-brand px-2 py-1 font-semibold text-black">
              {isRemote ? <GlobeAltIcon className="size-4" /> : <MapPinIcon className="size-4" />}
              {isRemote ? "Remote" : "Offline"}
            </span>
            {totalAccepted > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAcceptedModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 font-medium underline decoration-black/30 underline-offset-4 hover:decoration-black"
              >
                <CheckCircleIcon className="size-4" />
                {totalAccepted} accepted {totalAccepted === 1 ? "volunteer" : "volunteers"}
              </button>
            ) : (
              <span className="text-black/65">No accepted volunteers</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {event.imageUrl && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-black/5">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              unoptimized
              sizes="80px"
              className="object-cover"
            />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
          <h3 className="font-heading font-bold text-xl leading-tight tracking-tight text-black break-words">
            {event.title}
          </h3>
              <div className="grid gap-1.5 text-xs text-black">
            {/* Remote Duration or Offline Date/Time */}
            {isRemote ? (
              <div className="flex flex-wrap items-center gap-2">
                <ClockIcon className="w-4 h-4 text-black/65 shrink-0 stroke-[2]" />
                <span className="font-medium text-black">Duration: {event.duration || "Self-paced"}</span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <CalendarDaysIcon className="w-4 h-4 text-black/65 shrink-0 stroke-[2]" />
                <span className="font-medium text-black">{event.date}</span>
                {event.time && (
                  <>
                    <span className="text-black/65">•</span>
                    <div className="flex items-center gap-1 text-black">
                      <ClockIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Location (for Offline) */}
            {!isRemote && (
              <div className="flex flex-wrap items-center gap-2">
                <MapPinIcon className="w-4 h-4 text-black/65 shrink-0 stroke-[2]" />
                <span className="break-words">{event.location}</span>
              </div>
            )}
              </div>
            </div>
          </div>
        </header>
        <div className="grid gap-4 p-5 @min-[30rem]:grid-cols-[minmax(0,1fr)_11rem]">
          <div className="min-w-0 space-y-3">
          <p className="text-sm text-black font-primary leading-relaxed break-words">
            {event.description}
          </p>
          {/* Volunteer Task Snippet */}
          {event.taskToComplete && (
            <div className="pl-3 py-1 border-l-[3px] border-brand text-xs text-black flex items-start gap-2">
              <ClipboardDocumentCheckIcon className="w-4 h-4 text-black shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold">Task: </span>
                <span className="break-words">{event.taskToComplete}</span>
              </div>
            </div>
          )}
          </div>
          <section aria-label="Volunteer places" className="space-y-2 border-t border-black/15 pt-3 @min-[30rem]:border-l @min-[30rem]:border-t-0 @min-[30rem]:pl-4 @min-[30rem]:pt-0">
            {/* Volunteer Quotas (Separate student and alumni counts) */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="min-w-0">
                <span className="block text-[10px] text-black/65 font-semibold uppercase">Students</span>
                <span className="font-bold text-black font-heading">
                  {sAccepted} / {sNeeded} <span className="font-normal text-black/65">spots</span>
                </span>
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] text-black/65 font-semibold uppercase">Alumni</span>
                <span className="font-bold text-black font-heading">
                  {aAccepted} / {aNeeded} <span className="font-normal text-black/65">spots</span>
                </span>
              </div>
            </div>
            {/* Eligible Years */}
            {event.eligibleYears && event.eligibleYears.length > 0 && (
              <div className="text-[11px] text-black/65 pt-1">
                <span className="font-bold text-black">Eligible: </span>
                {event.eligibleYears.map((yr) => `Year ${yr}`).join(", ")}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Footer / Admin Actions */}
      <div className="px-5 py-3.5 bg-white border-t border-black/15 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onView?.(event)}
          className="rounded-sm text-xs font-heading font-bold text-black underline decoration-brand decoration-2 underline-offset-4 hover:decoration-black focus-visible:outline-black cursor-pointer"
        >
          View Details &rarr;
        </button>

        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(event);
              }}
              title="Edit event"
              className="p-1.5 rounded-lg text-black/65 hover:text-black hover:bg-black/10 transition cursor-pointer"
            >
              <PencilSquareIcon className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(event);
              }}
              title="Delete event"
              className="p-1.5 rounded-lg text-black/65 hover:text-black hover:bg-brand/15 transition cursor-pointer"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {/* Accepted Volunteers Popup Modal */}
      {isAcceptedModalOpen && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsAcceptedModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-lg w-full p-6 shadow-sm border border-black/15 space-y-5 max-h-[85vh] overflow-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-black/15 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-brand/15 text-black flex items-center justify-center shrink-0 border border-brand/60">
                  <CheckCircleIcon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-black">
                    Accepted Volunteers ({totalAccepted})
                  </h3>
                  <p className="text-xs text-black/65 truncate max-w-xs sm:max-w-sm">
                    {event.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAcceptedModalOpen(false)}
                className="p-1.5 text-black/65 hover:text-black rounded-md hover:bg-black/5 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Quota Progress Summary */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="p-3 rounded-lg bg-black/5 border border-black/15">
                <span className="block text-[10px] font-bold uppercase text-black/65">Student Spots</span>
                <span className="font-heading font-bold text-black text-sm mt-0.5 block">
                  {sAccepted} / {sNeeded} <span className="font-normal text-xs text-black/65">accepted</span>
                </span>
              </div>
              <div className="p-3 rounded-lg bg-black/5 border border-black/15">
                <span className="block text-[10px] font-bold uppercase text-black/65">Alumni Spots</span>
                <span className="font-heading font-bold text-black text-sm mt-0.5 block">
                  {aAccepted} / {aNeeded} <span className="font-normal text-xs text-black/65">accepted</span>
                </span>
              </div>
            </div>

            {/* Accepted Volunteers List */}
            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {allAccepted.map((vol: any, idx: number) => (
                <div
                  key={vol.email || idx}
                  className="p-3.5 rounded-lg bg-brand/15 border border-brand/60 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5 truncate mr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black text-sm">{vol.name || "Volunteer"}</span>
                      <span className="text-[10px] font-bold text-black bg-brand/15 px-2 py-0.2 rounded-md">
                        Confirmed
                      </span>
                    </div>

                    <a
                      href={`mailto:${vol.email}`}
                      className="text-black hover:text-black flex items-center gap-1 font-mono text-[11px] truncate"
                    >
                      <EnvelopeIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                      <span className="truncate">{vol.email}</span>
                    </a>

                    {(vol.college || vol.company) && (
                      <p className="text-[11px] text-black/65 truncate">
                        {vol.college || vol.company} {vol.year_of_study ? `(${vol.year_of_study})` : ""}
                      </p>
                    )}

                    {vol.accepted_at && (
                      <p className="text-[10px] text-black/65 font-mono">
                        Accepted on: {new Date(vol.accepted_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider ${
                        vol.volunteerRole === "Alumni"
                          ? "bg-brand/15 text-black border border-brand/60"
                          : "bg-brand/15 text-black border border-brand/60"
                      }`}
                    >
                      {vol.volunteerRole}
                    </span>

                    {/* Admin Approval & AI Batch Assignment Controls */}
                    {vol.assignment_approved ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-black bg-brand/15 border border-brand/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3 text-black stroke-[2.5]" />
                          <span>Approved ({vol.assigned_count ?? 10} assigned)</span>
                        </span>
                        {onViewAssignments && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewAssignments(event, vol);
                            }}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-black bg-brand/15 hover:bg-brand/30 border border-brand/60 transition cursor-pointer"
                          >
                            View List
                          </button>
                        )}
                      </div>
                    ) : onApproveAssignment ? (
                      <button
                        type="button"
                        disabled={isApprovingAssignment && approvingEmail === vol.email}
                        onClick={(e) => {
                          e.stopPropagation();
                          onApproveAssignment(event.id, vol.email);
                        }}
                        className="px-2.5 py-1 rounded-md text-[10px] font-bold text-black bg-brand hover:brightness-95 border border-brand transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircleIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                        <span>
                          {isApprovingAssignment && approvingEmail === vol.email
                            ? "AI Matching..."
                            : "Approve & Assign (10)"}
                        </span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-black font-semibold bg-brand/15 border border-brand/60 px-2 py-0.5 rounded-lg">
                        Pending Admin Approval
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="pt-2 border-t border-black/15 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsAcceptedModalOpen(false)}
                className="px-5 py-2.5 rounded-md text-xs font-heading font-bold text-black bg-black/5 hover:bg-black/10 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
