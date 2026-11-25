"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon,
  PhotoIcon,
  ArrowUpTrayIcon,
  FunnelIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  EnvelopeIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { getAdminToken, adminApi } from "../../lib/api";
import AdminSidebar from "../../components/AdminSidebar";
import SignOutModal from "../../components/SignOutModal";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import EventCard, { EventCardData } from "../../components/EventCard";

export default function AdminEventsScreen() {
  const router = useRouter();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // Delete Confirmation Modal State
  const [eventToDelete, setEventToDelete] = useState<EventCardData | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

  // Show the last fetched list immediately while refreshing from the backend.
  const [eventsList, setEventsList] = useState<EventCardData[]>([]);

  const restoreCachedEvents = () => {
    try {
      const cached = sessionStorage.getItem("maatram_admin_events_cache");
      const parsed = cached ? JSON.parse(cached) : [];
      if (Array.isArray(parsed)) {
        setEventsList(
          parsed.map((item: any) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              date: item.event_date || item.date || "TBD",
              time: item.event_time || item.time || "",
              location: item.location || "Chennai",
              category: item.category || "Volunteer Drive",
              targetAudience: item.target_audience || item.targetAudience || "",
              imageUrl: item.image_url || item.imageUrl || "",
              status: item.status || "upcoming",
              mode: item.mode || "offline",
              studentVolunteersNeeded: item.student_volunteers_needed ?? item.studentVolunteersNeeded ?? 0,
              alumniVolunteersNeeded: item.alumni_volunteers_needed ?? item.alumniVolunteersNeeded ?? 0,
              taskToComplete: item.task_to_complete || item.taskToComplete || "",
              duration: item.duration || "",
              startTime: item.start_time || item.startTime || "",
              endTime: item.end_time || item.endTime || "",
              eligibleYears: item.eligible_years || item.eligibleYears || ["1", "2", "3", "4"],
              acceptedStudents: item.accepted_students || item.acceptedStudents || [],
              acceptedAlumni: item.accepted_alumni || item.acceptedAlumni || [],
              rejectedParticipants: item.rejected_participants || item.rejectedParticipants || [],
              volunteerAssignments: item.volunteer_assignments || item.volunteerAssignments || {},
          }))
        );
      }
    } catch (error) {
      console.warn("Could not read cached admin events:", error);
    }
  };

  // Fetch events from database
  const fetchEvents = async () => {
    try {
      const res = await adminApi.getEvents();
      if (res.success && Array.isArray(res.data)) {
        const formatted: EventCardData[] = res.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          date: item.event_date || item.date,
          time: item.event_time || item.time || "",
          location: item.location,
          category: item.category || "Volunteer Drive",
          targetAudience: item.target_audience || item.targetAudience || "",
          imageUrl: item.image_url || item.imageUrl || "",
          status: item.status || "upcoming",
          mode: item.mode || "offline",
          studentVolunteersNeeded: item.student_volunteers_needed ?? item.studentVolunteersNeeded ?? 0,
          alumniVolunteersNeeded: item.alumni_volunteers_needed ?? item.alumniVolunteersNeeded ?? 0,
          taskToComplete: item.task_to_complete || item.taskToComplete || "",
          duration: item.duration || "",
          startTime: item.start_time || item.startTime || "",
          endTime: item.end_time || item.endTime || "",
          eligibleYears: item.eligible_years || item.eligibleYears || ["1", "2", "3", "4"],
          acceptedStudents: item.accepted_students || item.acceptedStudents || [],
          acceptedAlumni: item.accepted_alumni || item.acceptedAlumni || [],
          rejectedParticipants: item.rejected_participants || item.rejectedParticipants || [],
          volunteerAssignments: item.volunteer_assignments || item.volunteerAssignments || {},
        }));
        setEventsList(formatted);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("maatram_admin_events_cache", JSON.stringify(formatted));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error("Failed to fetch events from database:", err);
    }
  };

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
    } else {
      restoreCachedEvents();
      fetchEvents();
    }
  }, [router]);

  // Create / Edit Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<"choose_mode" | "form">("choose_mode");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Form Fields
  const [eventMode, setEventMode] = useState<"remote" | "offline">("offline");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [studentVolunteersNeeded, setStudentVolunteersNeeded] = useState<number | string>(10);
  const [alumniVolunteersNeeded, setAlumniVolunteersNeeded] = useState<number | string>(5);
  const [taskToComplete, setTaskToComplete] = useState("");
  const [duration, setDuration] = useState(""); // For Remote
  const [startTime, setStartTime] = useState(""); // For Offline
  const [endTime, setEndTime] = useState(""); // For Offline
  const [eventDate, setEventDate] = useState(""); // For Offline
  const [eventLocation, setEventLocation] = useState(""); // For Offline
  const [eligibleYears, setEligibleYears] = useState<string[]>(["1", "2", "3", "4"]);
  const [eventCategory, setEventCategory] = useState("Volunteer Drive");
  const [eventImageUrl, setEventImageUrl] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [eventStatus, setEventStatus] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [sendEmailNotification, setSendEmailNotification] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail View Modal State
  const [selectedEvent, setSelectedEvent] = useState<EventCardData | null>(null);

  // Volunteer Assignment Approval State
  const [isApprovingAssignment, setIsApprovingAssignment] = useState(false);
  const [approvingEmail, setApprovingEmail] = useState("");
  const [assignedViewModalOpen, setAssignedViewModalOpen] = useState(false);
  const [assignedViewVolunteer, setAssignedViewVolunteer] = useState<any>(null);
  const [assignedViewEvent, setAssignedViewEvent] = useState<EventCardData | null>(null);
  const [assignedApplicantsList, setAssignedApplicantsList] = useState<any[]>([]);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // Admin approves volunteer assignment and runs Hybrid AI matcher
  const handleApproveAssignment = async (eventId: string, volunteerEmail: string) => {
    try {
      setIsApprovingAssignment(true);
      setApprovingEmail(volunteerEmail);
      const res = await adminApi.approveVolunteerAssignment(eventId, volunteerEmail, 10);
      if (res.success) {
        setToastMessage(`Assignment approved! ${res.assignedCount || 10} applicants assigned to ${volunteerEmail}.`);
        await fetchEvents();
        // Update selectedEvent if currently open
        if (selectedEvent && selectedEvent.id === eventId) {
          const updated = (await adminApi.getEvents()).data?.find((e: any) => e.id === eventId);
          if (updated) {
            setSelectedEvent({
              ...selectedEvent,
              acceptedStudents: updated.accepted_students || updated.acceptedStudents || [],
              acceptedAlumni: updated.accepted_alumni || updated.acceptedAlumni || [],
              volunteerAssignments: updated.volunteer_assignments || updated.volunteerAssignments || {},
            });
          }
        }
      } else {
        alert(res.message || "Failed to approve assignment");
      }
    } catch (err: any) {
      alert(err.message || "Error approving assignment");
    } finally {
      setIsApprovingAssignment(false);
      setApprovingEmail("");
      setTimeout(() => setToastMessage(""), 5000);
    }
  };

  // View Assigned Applicants for a volunteer
  const handleViewAssignments = async (event: EventCardData, volunteer: any) => {
    try {
      setAssignedViewEvent(event);
      setAssignedViewVolunteer(volunteer);
      setAssignedViewModalOpen(true);
      setIsLoadingAssignments(true);

      const res = await adminApi.getEventAssignments(event.id, volunteer.email);
      if (res.success && Array.isArray(res.data?.assigned_applicants)) {
        setAssignedApplicantsList(res.data.assigned_applicants);
      } else {
        // Fallback to local map if present
        const local = event.volunteerAssignments?.[volunteer.email?.toLowerCase()] || [];
        setAssignedApplicantsList(local);
      }
    } catch (err) {
      console.error("Failed to fetch assigned applicants:", err);
      const local = event.volunteerAssignments?.[volunteer.email?.toLowerCase()] || [];
      setAssignedApplicantsList(local);
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  // Handle local image file upload + preview
  const bannerReader = React.useRef<FileReader | null>(null);
  const [readingBanner, setReadingBanner] = useState(false);
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Image size should be less than 10MB");
        return;
      }
      setImageFileName(file.name);
      const reader = new FileReader();
      bannerReader.current?.abort();
      bannerReader.current = reader;
      setReadingBanner(true);
      reader.onerror = () => {
        setFormError("Could not read the banner. Select it again.");
        setReadingBanner(false);
        setImageFileName("");
      };
      reader.onload = () => {
        setReadingBanner(false);
        setEventImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    bannerReader.current?.abort();
    setReadingBanner(false);
    setEditingEventId(null);
    setEventMode("offline");
    setEventTitle("");
    setEventDescription("");
    setStudentVolunteersNeeded(10);
    setAlumniVolunteersNeeded(5);
    setTaskToComplete("");
    setDuration("");
    setStartTime("");
    setEndTime("");
    setEventDate("");
    setEventLocation("");
    setEligibleYears(["1", "2", "3", "4"]);
    setEventCategory("Volunteer Drive");
    setEventImageUrl("");
    setImageFileName("");
    setEventStatus("upcoming");
    setSendEmailNotification(false);
    setFormError("");
    setModalStep("choose_mode");
    setIsSubmitting(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsEventModalOpen(true);
  };

  const pickMode = (mode: "remote" | "offline") => {
    setEventMode(mode);
    if (mode === "remote") {
      setEventLocation("Online / Remote");
      if (!duration) setDuration("2 Days");
    } else {
      if (eventLocation === "Online / Remote") setEventLocation("");
      if (!eventDate) setEventDate(new Date().toISOString().split("T")[0]);
      if (!startTime) setStartTime("09:30 AM");
      if (!endTime) setEndTime("01:30 PM");
    }
    setModalStep("form");
  };

  const toggleEligibleYear = (yr: string) => {
    setEligibleYears((prev) =>
      prev.includes(yr) ? prev.filter((y) => y !== yr) : [...prev, yr].sort()
    );
  };

  const openEditModal = (event: EventCardData) => {
    setEditingEventId(event.id);
    setEventMode(event.mode === "remote" ? "remote" : "offline");
    setEventTitle(event.title);
    setEventDescription(event.description);
    setStudentVolunteersNeeded(event.studentVolunteersNeeded ?? 0);
    setAlumniVolunteersNeeded(event.alumniVolunteersNeeded ?? 0);
    setTaskToComplete(event.taskToComplete || "");
    setDuration(event.duration || "");
    setStartTime(event.startTime || event.time?.split("-")[0]?.trim() || "");
    setEndTime(event.endTime || event.time?.split("-")[1]?.trim() || "");
    setEventDate(event.date || "");
    setEventLocation(event.location || "");
    setEligibleYears(event.eligibleYears || ["1", "2", "3", "4"]);
    setEventCategory(event.category || "Volunteer Drive");
    setEventImageUrl(event.imageUrl || "");
    setImageFileName(event.imageUrl ? "Existing Image" : "");
    setEventStatus(event.status || "upcoming");
    setSendEmailNotification(false);
    setFormError("");
    setModalStep("form");
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readingBanner || isSubmitting) return;
    if (!eventTitle.trim()) {
      setFormError("Event name is required");
      return;
    }
    if (eventMode === "offline") {
      if (!eventDate.trim()) {
        setFormError("Event date is required for offline event");
        return;
      }
      if (!eventLocation.trim()) {
        setFormError("Event location is required for offline event");
        return;
      }
    }
    if (eligibleYears.length === 0) {
      setFormError("Please select at least one eligible student year (1, 2, 3, 4)");
      return;
    }

    setIsSubmitting(true);
    setFormError("");

    const payload = {
      title: eventTitle.trim(),
      description: eventDescription.trim(),
      date: eventMode === "offline" ? eventDate.trim() : new Date().toISOString().split("T")[0],
      time: startTime && endTime ? `${startTime} - ${endTime}` : startTime || duration,
      location: eventMode === "remote" ? "Online / Remote" : eventLocation.trim(),
      category: eventCategory,
      targetAudience: `Scholars (Years: ${eligibleYears.join(", ")}) & Alumni`,
      imageUrl: editingEventId && eventImageUrl && !eventImageUrl.startsWith("data:") ? undefined : eventImageUrl,
      status: eventStatus,
      // Specific Volunteer Event Attributes
      mode: eventMode,
      studentVolunteersNeeded: Number(studentVolunteersNeeded) || 0,
      alumniVolunteersNeeded: Number(alumniVolunteersNeeded) || 0,
      taskToComplete: taskToComplete.trim(),
      duration: duration.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      eligibleYears,
      sendEmailNotification,
    };

    try {
      if (editingEventId) {
        const res = await adminApi.updateEvent(editingEventId, payload);
        if (res.success) {
          await fetchEvents();
          setToastMessage(res.message || "Event updated.");
        } else {
          setFormError(res.message || "Failed to update event");
          setIsSubmitting(false);
          return;
        }
      } else {
        const res = await adminApi.createEvent(payload);
        if (res.success) {
          await fetchEvents();
          setToastMessage(res.message || "Event published.");
        } else {
          setFormError(res.message || "Failed to create event");
          setIsSubmitting(false);
          return;
        }
      }

      setIsEventModalOpen(false);
      resetForm();
      setTimeout(() => setToastMessage(""), 5000);
    } catch (err: any) {
      setFormError("Error saving event: " + (err.message || "Server error"));
      setIsSubmitting(false);
    }
  };

  // Trigger Delete Confirmation Modal
  const handleDeleteEvent = (event: EventCardData) => {
    setEventToDelete(event);
  };

  // Perform event deletion
  const handleConfirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    setIsDeletingEvent(true);
    try {
      await adminApi.deleteEvent(eventToDelete.id);
      setEventsList((prev) => prev.filter((ev) => ev.id !== eventToDelete.id));
      if (selectedEvent?.id === eventToDelete.id) {
        setSelectedEvent(null);
      }
      setEventToDelete(null);
      setToastMessage("Event deleted successfully.");
      setTimeout(() => setToastMessage(""), 4000);
    } catch (err: any) {
      alert("Failed to delete event: " + (err.message || "Server error"));
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const filteredEvents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return eventsList.filter((event) =>
      [event.title, event.location, event.description].some((value) =>
        value?.toLowerCase().includes(query)
      )
    );
  }, [eventsList, searchTerm]);

  return (
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Yellow & White Sidebar */}
      <AdminSidebar
        activeTab="events"
        onSignOutClick={() => setIsSignOutModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8 flex-1">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight mt-1">
                Volunteer Events
              </h1>
              <p className="font-primary text-xs sm:text-sm text-black mt-1">
                Create Remote or Offline volunteer events, set student and alumni quotas, and broadcast instant email invitations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-heading font-bold text-black bg-brand hover:brightness-95 transition cursor-pointer border border-brand"
              >
                <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                <span>Create Event</span>
              </button>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="p-4 bg-brand/15 border border-brand/60 rounded-lg text-xs text-black font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircleIcon className="w-5 h-5 text-black shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          <div className="bg-white border border-black/15 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none w-4 h-4 text-black/65 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                aria-label="Search events"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events by title or venue..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-md border border-black/15 bg-black/5 text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:bg-white transition"
              />
            </div>
          </div>

          {/* Events Grid */}
          {filteredEvents.length === 0 ? (
            <div className="bg-white border border-black/15 rounded-xl p-16 text-center space-y-3">
              <CalendarDaysIcon className="w-12 h-12 mx-auto text-black/65 stroke-1" />
              <p className="text-sm font-heading font-bold text-black">No Volunteer Events Found</p>
              <p className="text-xs text-black/65 max-w-sm mx-auto">
                {searchTerm.trim() ? "Try a different title or venue." : "Create an event to start inviting volunteers."}
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 mt-2 rounded-md text-xs font-heading font-bold text-black bg-brand hover:brightness-95 transition border border-brand"
              >
                <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                <span>Create Volunteer Event</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onView={(ev) => setSelectedEvent(ev)}
                  onEdit={(ev) => openEditModal(ev)}
                  onDelete={(ev) => handleDeleteEvent(ev)}
                  onApproveAssignment={handleApproveAssignment}
                  onViewAssignments={handleViewAssignments}
                  isApprovingAssignment={isApprovingAssignment}
                  approvingEmail={approvingEmail}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* CREATE / EDIT EVENT POPUP MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5">
          <div className="bg-white rounded-lg border border-black/15 shadow-sm max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* STEP 1: CHOOSE REMOTE OR OFFLINE */}
            {modalStep === "choose_mode" && !editingEventId ? (
              <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-black/15">
                  <div>
                    <h3 className="font-heading font-bold text-lg sm:text-xl text-black">
                      Create Volunteer Event
                    </h3>
                    <p className="text-xs text-black/65 mt-0.5">
                      First, select the format of the event you wish to post:
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="text-black/65 hover:text-black font-bold text-sm w-8 h-8 rounded-md hover:bg-black/5 flex items-center justify-center transition cursor-pointer"
                  >
                    <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Remote Choice Card */}
                  <button
                    type="button"
                    onClick={() => pickMode("remote")}
                    className="p-6 rounded-lg border-2 border-black/15 hover:border-black hover:bg-black/5 transition cursor-pointer text-left space-y-3 group"
                  >
                    <div className="w-12 h-12 rounded-md bg-black/5 text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition">
                      <GlobeAltIcon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base text-black">
                        Remote Event
                      </h4>
                      <p className="text-xs text-black/65 mt-1 leading-relaxed">
                        Online tasks, applicant verification calling drives, peer tutoring, and virtual mentoring sessions.
                      </p>
                    </div>
                    <span className="inline-block text-[11px] font-bold text-black group-hover:underline">
                      Duration-based completion &rarr;
                    </span>
                  </button>

                  {/* Offline Choice Card */}
                  <button
                    type="button"
                    onClick={() => pickMode("offline")}
                    className="p-6 rounded-lg border-2 border-black/15 hover:border-black hover:bg-black/5 transition cursor-pointer text-left space-y-3 group"
                  >
                    <div className="w-12 h-12 rounded-md bg-black/5 text-black flex items-center justify-center group-hover:bg-black group-hover:text-white transition">
                      <BuildingOfficeIcon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-base text-black">
                        Offline Event
                      </h4>
                      <p className="text-xs text-black/65 mt-1 leading-relaxed">
                        On-ground physical drives, venue registration desks, annual meets, ceremonies, and field visit verification.
                      </p>
                    </div>
                    <span className="inline-block text-[11px] font-bold text-black group-hover:underline">
                      Venue & scheduled time slot &rarr;
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: FORM POPUP (CUSTOMIZED FOR REMOTE OR OFFLINE) */
              <form onSubmit={handleSaveEvent} className="flex flex-col flex-1 overflow-hidden min-h-0">
                {/* Fixed Header */}
                <div className="px-6 py-4 border-b border-black/15 flex items-center justify-between shrink-0 bg-white">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/5 text-black border border-black/15">
                      {eventMode === "remote" ? "Remote Event" : "Offline Event"}
                    </span>
                    {!editingEventId && (
                      <button
                        type="button"
                        onClick={() => setModalStep("choose_mode")}
                        className="text-[11px] text-black/65 hover:text-black underline underline-offset-2 transition cursor-pointer"
                      >
                        Change Format
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="text-black/65 hover:text-black font-bold text-sm w-7 h-7 rounded-lg hover:bg-black/5 flex items-center justify-center transition cursor-pointer"
                  >
                    <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
                  </button>
                </div>

                {/* Scrollable Form Body with Wide 2-Column Responsive Layout */}
                <div className="px-6 sm:px-7 py-5 overflow-y-auto flex-1 space-y-4">
                  {formError && (
                    <div className="p-3.5 rounded-md bg-brand/15 border border-brand/60 text-black text-xs font-semibold">
                      {formError}
                    </div>
                  )}

                  {/* Full-Width: Event Name */}
                  <div>
                    <label className="block text-xs font-heading font-bold text-black mb-1">
                      {eventMode === "remote" ? "Event Name" : "Name of the Event"} <span className="text-black/65">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      placeholder={
                        eventMode === "remote"
                          ? "e.g. Telephonic Candidate Background Calling Drive"
                          : "e.g. Annual Scholars Meet & Registration Desk"
                      }
                      className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition"
                    />
                  </div>

                  {/* 2-Column Responsive Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* LEFT COLUMN: Quotas, Task, Schedule/Location, Description */}
                    <div className="space-y-4">
                      {/* SEPARATE VOLUNTEER COUNTS */}
                      <div className="p-3.5 rounded-md bg-black/5 border border-black/15 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="block text-[11px] font-heading font-bold text-black uppercase tracking-wider">
                            Number of Volunteers Needed
                          </span>
                          <span className="text-[10px] text-black/65 font-medium bg-white px-2 py-0.5 rounded-md border border-black/15">
                            First-Come Basis
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-black mb-1">
                              Student Count <span className="text-black/65">*</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              required
                              value={studentVolunteersNeeded}
                              onChange={(e) => setStudentVolunteersNeeded(e.target.value)}
                              placeholder="e.g. 50"
                              className="w-full px-3.5 py-2 rounded-md border border-black/15 bg-white text-xs font-bold text-black focus:outline-none focus:border-black"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-black mb-1">
                              Alumni Count <span className="text-black/65">*</span>
                            </label>
                            <input
                              type="number"
                              min={0}
                              required
                              value={alumniVolunteersNeeded}
                              onChange={(e) => setAlumniVolunteersNeeded(e.target.value)}
                              placeholder="e.g. 20"
                              className="w-full px-3.5 py-2 rounded-md border border-black/15 bg-white text-xs font-bold text-black focus:outline-none focus:border-black"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Task to Complete */}
                      <div>
                        <label className="block text-xs font-heading font-bold text-black mb-1">
                          Task to Complete <span className="text-black/65">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={taskToComplete}
                          onChange={(e) => setTaskToComplete(e.target.value)}
                          placeholder={
                            eventMode === "remote"
                              ? "e.g. Call 15 shortlisted 12th standard applicants to verify family details"
                              : "e.g. Manage registration desk, name badges, and guest felicitation"
                          }
                          className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition"
                        />
                      </div>

                      {/* REMOTE SPECIFIC: Duration to Complete the Task */}
                      {eventMode === "remote" && (
                        <div>
                          <label className="block text-xs font-heading font-bold text-black mb-1">
                            Duration to Complete the Task <span className="text-black/65">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            placeholder="e.g. 3 Days (Complete by Sunday 5:00 PM)"
                            className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition"
                          />
                        </div>
                      )}

                      {/* OFFLINE SPECIFIC: Date, Time (Start and End), Location */}
                      {eventMode === "offline" && (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-heading font-bold text-black mb-1">
                                Date <span className="text-black/65">*</span>
                              </label>
                              <input
                                type="date"
                                required
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-black"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-heading font-bold text-black mb-1">
                                Start Time <span className="text-black/65">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                placeholder="09:00 AM"
                                className="w-full px-3 py-2 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-black"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-heading font-bold text-black mb-1">
                                End Time <span className="text-black/65">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                placeholder="01:30 PM"
                                className="w-full px-3 py-2 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-black"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-heading font-bold text-black mb-1">
                              Location <span className="text-black/65">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={eventLocation}
                              onChange={(e) => setEventLocation(e.target.value)}
                              placeholder="e.g. Kamaraj Arangam, T. Nagar, Chennai"
                              className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-black"
                            />
                          </div>
                        </>
                      )}

                      {/* Description */}
                      <div>
                        <label className="block text-xs font-heading font-bold text-black mb-1">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={eventDescription}
                          onChange={(e) => setEventDescription(e.target.value)}
                          placeholder="Provide background, guidelines, and expectations for the volunteers..."
                          className="w-full px-3.5 py-2 rounded-md border border-black/15 bg-white text-xs text-black focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Eligible Years, Banner Upload (Post-section style), Email Broadcast Toggle */}
                    <div className="space-y-4">
                      {/* Eligible Year Student (1, 2, 3, 4) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-heading font-bold text-black">
                            Eligible Year Student (1, 2, 3, 4) <span className="text-black/65">*</span>
                          </label>
                          <span className="text-[11px] text-black/65">
                            Select eligible college years
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {["1", "2", "3", "4"].map((yr) => {
                            const isSelected = eligibleYears.includes(yr);
                            return (
                              <button
                                key={yr}
                                type="button"
                                onClick={() => toggleEligibleYear(yr)}
                                className={`py-2 px-3 rounded-md text-xs font-heading font-bold transition cursor-pointer border text-center flex items-center justify-center gap-1.5 ${
                                  isSelected
                                    ? "bg-black text-white border-black "
                                    : "bg-white text-black border-black/15 hover:bg-black/5"
                                }`}
                              >
                                <span>Year {yr}</span>
                                {isSelected && <CheckCircleIcon className="w-3.5 h-3.5 text-brand shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Banner Image Upload (SAME AS POST SECTION) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-xs font-heading font-bold text-black">
                            Banner Image (Optional) <span className="text-black/65 font-normal">(PNG, JPG, WEBP up to 10MB)</span>
                          </label>
                          {eventImageUrl && (
                            <span className="text-[10px] font-bold text-black bg-black/5 border border-black/15 px-2 py-0.5 rounded-md">
                              1 Image selected
                            </span>
                          )}
                        </div>

                        {!eventImageUrl ? (
                          <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-black/15 hover:border-black rounded-lg bg-black/5 hover:bg-black/10 transition cursor-pointer group">
                            <div className="w-10 h-10 rounded-md bg-white border border-black/15 flex items-center justify-center text-black/65 group-hover:text-black transition mb-2">
                              <PhotoIcon className="w-5 h-5 stroke-[2]" />
                            </div>
                            <p className="text-xs font-heading font-bold text-black">
                              Click to upload banner image
                            </p>
                            <p className="text-[11px] text-black/65 mt-0.5">
                              Supports PNG, JPG, WEBP up to 10MB
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageFileChange}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="relative rounded-lg border border-black/15 bg-black/5 overflow-hidden h-36 group">
                            <img
                              src={eventImageUrl}
                              alt="Banner preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition flex items-end justify-between p-3">
                              <div className="min-w-0 pr-2">
                                <p className="text-xs text-white font-bold truncate">
                                  {imageFileName || "Banner Image"}
                                </p>
                                <p className="text-[10px] text-black/65">
                                  Ready to attach to event
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEventImageUrl("");
                                  setImageFileName("");
                                }}
                                className="p-1.5 bg-black hover:bg-black text-white rounded-md transition cursor-pointer shrink-0"
                                title="Remove banner"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Email Broadcast Toggle Switch (Only send if admin turns ON) */}
                      <div className="p-3.5 rounded-lg bg-black/5 border border-black/15 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-md flex items-center justify-center transition ${
                                sendEmailNotification
                                  ? "bg-black text-brand"
                                  : "bg-black/10 text-black/65"
                              }`}
                            >
                              <EnvelopeIcon className="w-4 h-4 stroke-[2]" />
                            </div>
                            <div>
                              <p className="text-xs font-heading font-bold text-black">
                                Email Broadcast to Volunteers
                              </p>
                              <p className="text-[10px] text-black/65">
                                {sendEmailNotification ? "Enabled — email alerts will be sent" : "Disabled — no emails will be sent"}
                              </p>
                            </div>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            role="switch"
                            aria-checked={sendEmailNotification}
                            onClick={() => setSendEmailNotification(!sendEmailNotification)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              sendEmailNotification ? "bg-black" : "bg-black/10"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${
                                sendEmailNotification ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        <p className="text-[11px] text-black/65 leading-relaxed border-t border-black/15 pt-2">
                          {sendEmailNotification
                            ? "When posted, registered student & alumni volunteers will immediately receive an email alert with an invitation to accept."
                            : "No email alerts will be sent. Volunteers can only discover this event when browsing their volunteer dashboard."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="px-6 py-3 border-t border-black/15 flex items-center justify-end gap-3 shrink-0 bg-black/5">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="px-4 py-2 text-xs font-heading font-bold text-black hover:bg-black/10 rounded-md transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || readingBanner}
                    className="px-5 py-2.5 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Publishing & Notifying...</span>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4 stroke-[2]" />
                        <span>{editingEventId ? "Save Changes" : "Post Volunteer Event"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* DETAIL VIEW POPUP MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5">
          <div className="bg-white rounded-lg border border-black/15 shadow-sm max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {selectedEvent.imageUrl && (
              <div className="relative w-full h-44 bg-black/5 shrink-0">
                <Image
                  src={selectedEvent.imageUrl}
                  alt={selectedEvent.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black flex items-center justify-center transition cursor-pointer"
                >
                  <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
                </button>
              </div>
            )}

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-heading font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-black/5 text-black border border-black/15">
                  {selectedEvent.mode === "remote" ? "Remote Event" : "Offline Event"}
                </span>
                {((selectedEvent.acceptedStudents?.length || 0) + (selectedEvent.acceptedAlumni?.length || 0)) > 0 ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-brand/15 text-black border border-brand/60 flex items-center gap-1">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                    <span>
                      {(selectedEvent.acceptedStudents?.length || 0) + (selectedEvent.acceptedAlumni?.length || 0)} Accepted Volunteers
                    </span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-black/5 text-black border border-black/15">
                    0 Accepted Volunteers
                  </span>
                )}
              </div>

              <h2 className="font-heading font-bold text-xl text-black">
                {selectedEvent.title}
              </h2>

              <p className="text-xs text-black leading-relaxed font-primary">
                {selectedEvent.description}
              </p>

              {/* Task Highlight */}
              {selectedEvent.taskToComplete && (
                <div className="p-3 bg-black/5 border border-black/15 rounded-md text-xs text-black">
                  <span className="font-bold text-black">Assigned Task: </span>
                  <span>{selectedEvent.taskToComplete}</span>
                </div>
              )}

              {/* Volunteer Quota Counter Cards */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-md bg-black/5 border border-black/15">
                  <span className="block text-[10px] font-bold uppercase text-black/65">
                    Student Volunteers (1st-come)
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-heading font-bold text-black">
                      {selectedEvent.acceptedStudents?.length || 0}
                    </span>
                    <span className="text-xs text-black/65">
                      / {selectedEvent.studentVolunteersNeeded || 0} accepted
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-md bg-black/5 border border-black/15">
                  <span className="block text-[10px] font-bold uppercase text-black/65">
                    Alumni Volunteers (1st-come)
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-heading font-bold text-black">
                      {selectedEvent.acceptedAlumni?.length || 0}
                    </span>
                    <span className="text-xs text-black/65">
                      / {selectedEvent.alumniVolunteersNeeded || 0} accepted
                    </span>
                  </div>
                </div>
              </div>

              {/* Accepted Volunteers List in View Modal */}
              {((selectedEvent.acceptedStudents?.length || 0) + (selectedEvent.acceptedAlumni?.length || 0)) > 0 && (
                <div className="pt-3 border-t border-black/15 space-y-2">
                  <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-black flex items-center gap-1.5">
                    <CheckCircleIcon className="w-4 h-4 text-black stroke-[2.5]" />
                    <span>
                      Accepted Volunteers ({(selectedEvent.acceptedStudents?.length || 0) + (selectedEvent.acceptedAlumni?.length || 0)})
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {[
                      ...(selectedEvent.acceptedStudents || []).map((s: any) => ({ ...s, volunteerRole: "Student" })),
                      ...(selectedEvent.acceptedAlumni || []).map((a: any) => ({ ...a, volunteerRole: "Alumni" })),
                    ].map((vol: any, idx: number) => (
                      <div
                        key={vol.email || idx}
                        className="p-3 rounded-md bg-brand/15 border border-brand/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-black">{vol.name || "Volunteer"}</p>
                          <p className="text-[11px] text-black">{vol.email}</p>
                          <p className="text-[10px] text-black/65 mt-0.5">
                            {vol.college || vol.company || "Maatram Foundation Volunteer"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              vol.volunteerRole === "Alumni"
                                ? "bg-brand/15 text-black border border-brand/60"
                                : "bg-brand/15 text-black border border-brand/60"
                            }`}
                          >
                            {vol.volunteerRole}
                          </span>

                          {vol.assignment_approved ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-black bg-brand/15 border border-brand/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3 text-black stroke-[2.5]" />
                                <span>Approved ({vol.assigned_count ?? 10} assigned)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleViewAssignments(selectedEvent, vol)}
                                className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-black bg-brand/15 hover:bg-brand/30 border border-brand/60 transition cursor-pointer"
                              >
                                View List
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isApprovingAssignment && approvingEmail === vol.email}
                              onClick={() => handleApproveAssignment(selectedEvent.id, vol.email)}
                              className="px-2.5 py-1 rounded-md text-[10px] font-bold text-black bg-brand hover:brightness-95 border border-brand transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircleIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                              <span>
                                {isApprovingAssignment && approvingEmail === vol.email
                                  ? "AI Matching..."
                                  : "Approve & Assign (10)"}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details List */}
              <div className="space-y-2 pt-3 border-t border-black/15 text-xs text-black">
                {selectedEvent.mode === "remote" ? (
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-black/65 stroke-[2]" />
                    <span>Duration: <strong>{selectedEvent.duration || "Self-paced"}</strong></span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <CalendarDaysIcon className="w-4 h-4 text-black/65 stroke-[2]" />
                      <span>Date: <strong>{selectedEvent.date}</strong> ({selectedEvent.time || "Scheduled slot"})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-4 h-4 text-black/65 stroke-[2]" />
                      <span>Venue: <strong>{selectedEvent.location}</strong></span>
                    </div>
                  </>
                )}

                {selectedEvent.eligibleYears && (
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4 text-black/65 stroke-[2]" />
                    <span>Eligible Student Years: <strong>{selectedEvent.eligibleYears.map(y => `Year ${y}`).join(", ")}</strong></span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-black/15">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const ev = selectedEvent;
                      setSelectedEvent(null);
                      openEditModal(ev);
                    }}
                    className="px-3.5 py-1.5 rounded-md text-xs font-heading font-semibold text-black bg-black/5 hover:bg-black/10 transition cursor-pointer"
                  >
                    Edit Event
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(selectedEvent)}
                    className="px-3.5 py-1.5 rounded-md text-xs font-heading font-semibold text-black bg-brand/15 hover:bg-brand/15 transition cursor-pointer"
                  >
                    Delete Event
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-1.5 rounded-md text-xs font-heading font-bold text-black hover:bg-black/5 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assigned Applicants Inspection Modal */}
      {assignedViewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl border border-black/15 shadow-sm max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-black/15 flex items-center justify-between bg-black/5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-brand/15 border border-brand/60 flex items-center justify-center text-black">
                  <ClipboardDocumentCheckIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-black">
                    Assigned Applicants ({assignedApplicantsList.length})
                  </h3>
                  <p className="text-xs text-black/65">
                    Volunteer: <strong className="text-black">{assignedViewVolunteer?.name}</strong> ({assignedViewVolunteer?.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignedViewModalOpen(false)}
                className="p-1.5 text-black/65 hover:text-black rounded-md hover:bg-black/5 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              {isLoadingAssignments ? (
                <div className="p-8 text-center text-black/65 text-xs">
                  Loading assigned applicants...
                </div>
              ) : assignedApplicantsList.length === 0 ? (
                <div className="p-8 text-center text-black/65 text-xs bg-black/5 rounded-lg border border-black/15">
                  No applicants assigned to this volunteer yet.
                </div>
              ) : (
                assignedApplicantsList.map((app: any, idx: number) => (
                  <div
                    key={app.id || app.application_number || idx}
                    className="p-4 rounded-lg bg-white border border-black/15 hover:border-brand/60 transition text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-black text-sm">{app.name}</span>
                          <span className="font-mono text-[10px] bg-black/5 text-black px-2 py-0.5 rounded-md font-semibold">
                            {app.application_number || `#${idx + 1}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-black/65 mt-0.5">
                          {app.district || "Tamil Nadu"} • {app.stream || app.degree || "Higher Secondary"}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand/15 text-black border border-brand/60 uppercase">
                        {app.status || "Pending Verification"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-black pt-1 border-t border-black/15">
                      {app.phone && (
                        <span>Phone: <strong className="font-mono text-black">{app.phone}</strong></span>
                      )}
                      {app.match_reason && (
                        <span className="text-black font-medium italic">
                          Match: {app.match_reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-black/15 bg-black/5 flex justify-end">
              <button
                type="button"
                onClick={() => setAssignedViewModalOpen(false)}
                className="px-5 py-2 rounded-md text-xs font-heading font-bold text-black bg-white hover:bg-black/5 border border-black/15 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!eventToDelete}
        onClose={() => setEventToDelete(null)}
        onConfirm={handleConfirmDeleteEvent}
        title="Delete Event"
        itemName={eventToDelete?.title}
        description="Are you sure you want to delete this event? It will be removed from all volunteer dashboards."
        confirmButtonText="Delete Event"
        isDeleting={isDeletingEvent}
      />

      {/* Sign Out Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
      />
    </div>
  );
}
