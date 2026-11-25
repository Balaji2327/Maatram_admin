"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  TableCellsIcon,
  XMarkIcon,
  PencilSquareIcon,
  ChatBubbleLeftEllipsisIcon,
  PhoneIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  BriefcaseIcon,
  SparklesIcon,
  IdentificationIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import { adminApi, getAdminToken, getAdminCachedData, setAdminCachedData, subscribeToAdminCache } from "../../lib/api";
import AdminSidebar from "../../components/AdminSidebar";
import SignOutModal from "../../components/SignOutModal";

export default function AdminVolunteersScreen() {
  const router = useRouter();

  // Authentication Guard
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
    }
  }, [router]);

  // Main Tab Navigation: Registered Volunteers vs Applicant Calling Verification
  const [activeSubTab, setActiveSubTab] = useState<"directory" | "verification">("directory");

  // Registered Volunteers Directory State
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "alumni">("all");
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);

  // Applicant Verification Reviews Data states
  const [applications, setApplications] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "reviewed" | "pending">("all");
  const [events, setEvents] = useState<any[]>([]);
  const [eventFilter, setEventFilter] = useState("all");
  const [assigningVolunteerId, setAssigningVolunteerId] = useState<string | null>(null);
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [volunteerPendingAssignment, setVolunteerPendingAssignment] = useState<any | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  // Inline Note Editing
  const [editingVolunteerId, setEditingVolunteerId] = useState<string | null>(null);
  const [volunteerNoteInput, setVolunteerNoteInput] = useState("");
  const [isSavingVolunteerNote, setIsSavingVolunteerNote] = useState(false);

  // Sync Modal
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState("");
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Fetch registered volunteers list
  const fetchVolunteers = async () => {
    try {
      const res = await adminApi.getRegisteredVolunteers();
      if (res && res.success && Array.isArray(res.data)) {
        setVolunteers(res.data);
        setAdminCachedData("volunteers", res.data);
      }
    } catch (err: any) {
      console.error("fetchVolunteers error:", err);
    }
  };

  // Fetch all applications
  const fetchApplications = async () => {
    setIsRefreshing(true);
    setErrorMessage("");
    try {
      const res = await adminApi.getApplications();
      if (res.success && res.data) {
        setApplications(res.data);
        setAdminCachedData("applications", res);
      } else {
        setErrorMessage(res.message || "Failed to load applications");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error loading applications");
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await adminApi.getEvents();
      if (res.success && Array.isArray(res.data)) {
        setEvents(res.data);
      }
    } catch (err: any) {
      console.error("fetchEvents error:", err);
    }
  };

  const handleAssignVolunteer = (volunteer: any) => {
    if (!volunteer.email && !volunteer.name) {
      setAssignmentMessage("This volunteer does not have valid identification for assignment.");
      return;
    }

    setVolunteerPendingAssignment(volunteer);
    setSelectedApplicationId(null);
  };

  const confirmAssignVolunteer = async () => {
    const volunteer = volunteerPendingAssignment;
    const application = candidateApplications.find(
      (item) => String(item.id) === String(selectedApplicationId)
    );
    if (!volunteer || !application) {
      setAssignmentMessage("Select a student application before assigning.");
      return;
    }

    setAssigningVolunteerId(String(volunteer.id || volunteer.email));
    setAssignmentMessage("");
    try {
      if (application.status === "submitted" || application.status === "draft") {
        const statusRes = await adminApi.updateStatus(application.id, "under_review");
        if (!statusRes.success) {
          throw new Error(statusRes.message || "Failed to update the application status.");
        }
      }
      const res = await adminApi.updateVolunteerSuggestion(
        application.id,
        application.volunteer_suggestion || "",
        volunteer.name || volunteer.email
      );
      if (!res.success) {
        throw new Error(res.message || "Failed to assign the student application.");
      }

      setAssignmentMessage(
        `${application.full_name || "Student application"} was assigned to ${volunteer.name || volunteer.email}. Switched to Volunteer Applications view.`
      );
      setVolunteerPendingAssignment(null);
      setSelectedApplicationId(null);
      await fetchApplications();
      // Automatically change view into volunteer verification applications tab
      setActiveSubTab("verification");
    } catch (err: any) {
      setAssignmentMessage(err.message || "Failed to assign the student application.");
    } finally {
      setAssigningVolunteerId(null);
    }
  };

  useEffect(() => {
    const cachedVolunteers = getAdminCachedData<any[]>("volunteers");
    const cachedApplications = getAdminCachedData<any>("applications")?.data;
    if (cachedVolunteers) setVolunteers(cachedVolunteers);
    if (cachedApplications) setApplications(cachedApplications);

    const unsubscribeVolunteers = subscribeToAdminCache("volunteers", () => {
      const cached = getAdminCachedData<any[]>("volunteers");
      if (cached) setVolunteers(cached);
    });
    const unsubscribeApplications = subscribeToAdminCache("applications", () => {
      const cached = getAdminCachedData<any>("applications")?.data;
      if (cached) setApplications(cached);
    });
    fetchVolunteers();
    fetchApplications();
    fetchEvents();
    return () => {
      unsubscribeVolunteers();
      unsubscribeApplications();
    };
  }, []);

  // Volunteer stats calculation (for admission candidates needing verification, excluding enrolled students)
  const candidateApplications = useMemo(() => {
    return applications.filter((a) => {
      const isAdmittedStudent =
        a.current_stage === "admitted" ||
        a.status === "selected" ||

        (a.application_number && a.application_number.includes("SCH-"));
      const isRejectedStudent =
        a.status === "rejected" ||
        a.current_stage === "rejected" ||
        a.stage_status === "rejected";
      return !isAdmittedStudent && !isRejectedStudent;
    });
  }, [applications]);

  const volunteerStats = useMemo(() => {
    let reviewed = 0;
    candidateApplications.forEach((a) => {
      if (a.volunteer_suggestion && String(a.volunteer_suggestion).trim() !== "") {
        reviewed++;
      }
    });
    return {
      reviewed,
      pending: Math.max(candidateApplications.length - reviewed, 0),
    };
  }, [candidateApplications]);

  // Filtered Registered Volunteers
  const filteredVolunteers = useMemo(() => {
    let result = [...volunteers];
    if (eventFilter !== "all") {
      const selectedEvent = events.find((event) => String(event.id) === eventFilter);
      const acceptedVolunteers = [
        ...(selectedEvent?.accepted_students || selectedEvent?.acceptedStudents || []),
        ...(selectedEvent?.accepted_alumni || selectedEvent?.acceptedAlumni || []),
      ];
      const assignedVolunteerEmails = Object.keys(
        selectedEvent?.volunteer_assignments || selectedEvent?.volunteerAssignments || {}
      ).map((email) => email.toLowerCase());
      const acceptedVolunteerKeys = acceptedVolunteers.flatMap((volunteer: any) => [
        volunteer.id,
        volunteer.volunteer_id,
        volunteer.user_id,
        volunteer.email,
        volunteer.volunteer_email,
        volunteer.name,
      ]).filter(Boolean).map((value: unknown) => String(value).toLowerCase());

      result = result.filter((volunteer) => {
        const volunteerKeys = [
          volunteer.id,
          volunteer.user_id,
          volunteer.email,
          volunteer.name,
        ].filter(Boolean).map((value: unknown) => String(value).toLowerCase());
        return volunteerKeys.some(
          (key) => acceptedVolunteerKeys.includes(key) || assignedVolunteerEmails.includes(key)
        );
      });
    }
    if (roleFilter !== "all") {
      result = result.filter((v) => (v.role || "student").toLowerCase() === roleFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q) ||
          v.phone?.includes(q) ||
          v.college?.toLowerCase().includes(q) ||
          v.department?.toLowerCase().includes(q) ||
          v.company?.toLowerCase().includes(q) ||
          v.skills?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [volunteers, roleFilter, searchQuery, eventFilter, events]);

  // Filter applications
  const filteredApplications = useMemo(() => {
    // Filter out admitted students — they are admitted students, not volunteer verification candidates
    let result = applications.filter((a) => {
      const isAdmittedStudent =
        a.current_stage === "admitted" ||
        a.status === "selected" ||

        (a.application_number && a.application_number.includes("SCH-"));
      return !isAdmittedStudent;
    });

    if (eventFilter !== "all") {
      const selectedEvent = events.find((event) => String(event.id) === eventFilter);
      const eventTitle = selectedEvent?.title?.toLowerCase();
      result = result.filter((application) => {
        const applicationEvent = String(
          application.event_id ||
          application.eventId ||
          application.event_name ||
          application.eventName ||
          application.event_title ||
          application.eventTitle ||
          ""
        ).toLowerCase();
        return applicationEvent === eventFilter.toLowerCase() || applicationEvent === eventTitle;
      });
    }

    if (statusFilter === "reviewed") {
      result = result.filter((a) => a.volunteer_suggestion && a.volunteer_suggestion.trim() !== "");
    } else if (statusFilter === "pending") {
      result = result.filter((a) => !a.volunteer_suggestion || a.volunteer_suggestion.trim() === "");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(q) ||
          a.application_number?.toLowerCase().includes(q) ||
          a.mobile_number?.includes(q) ||
          a.district?.toLowerCase().includes(q) ||
          a.volunteer_suggestion?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [applications, statusFilter, searchQuery, eventFilter, events]);

  // Export Excel with complete details and Volunteer Suggestion column
  const handleExportExcel = () => {
    if (applications.length === 0) {
      alert("No applicant data to export.");
      return;
    }

    try {
      const dataRows = applications.map((a) => ({
        "Application Number": a.application_number || "",
        "Student Name": a.full_name || "",
        "Status": a.status || "",
        "Volunteer Suggestion": a.volunteer_suggestion || "",
        "Volunteer Name": a.volunteer_name || "",
        "Contact Number": a.mobile_number || "",
        "Alternate Contact": a.alt_mobile_number || "",
        "Email ID": a.email || "",
        "District": a.district || "",
        "Address": a.address || "",
        "12th Cutoff": a.twelfth_cutoff || "",
        "12th Group / Stream": a.twelfth_group || a.twelfth_stream || "",
        "Family Annual Income": a.family_annual_income || a.annual_income || "",
        "Father Name & Work": `${a.father_name || "—"} (${a.father_occupation || "—"})`,
        "Mother Name & Work": `${a.mother_name || "—"} (${a.mother_occupation || "—"})`,
        "First Graduate": a.first_graduate ? "Yes" : "No",
        "Preferred Degree": a.preferred_degree || "",
        "Preferred Courses": Array.isArray(a.preferred_courses) ? a.preferred_courses.join(", ") : "",
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      const colWidths = Object.keys(dataRows[0] || {}).map((key) => ({
        wch: Math.min(Math.max(key.length, 14) + 4, 40),
      }));
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Volunteers_Calling_Sheet");
      XLSX.writeFile(workbook, `Maatram_Volunteers_Verification_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err: any) {
      alert("Failed to export Excel: " + err.message);
    }
  };

  // Save inline volunteer suggestion
  const handleSaveVolunteerNote = async (applicantId: string) => {
    if (!volunteerNoteInput.trim() && volunteerNoteInput !== "") return;
    setIsSavingVolunteerNote(true);
    try {
      const res = await adminApi.updateVolunteerSuggestion(applicantId, volunteerNoteInput.trim());
      if (res.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicantId ? { ...app, volunteer_suggestion: volunteerNoteInput.trim() } : app
          )
        );
        setEditingVolunteerId(null);
        setVolunteerNoteInput("");
      } else {
        alert(res.message || "Failed to save volunteer suggestion");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingVolunteerNote(false);
    }
  };

  // Sync from uploaded Excel/CSV
  const handleFileUploadSync = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSyncing(true);
    setSyncStatusMsg("Reading and parsing volunteer file...");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert("Uploaded sheet is empty.");
          setIsSyncing(false);
          return;
        }

        const suggestionsToSync: Array<{ application_number: string; suggestion: string }> = [];
        data.forEach((row) => {
          const appNum =
            row["Application Number"] ||
            row["Application No"] ||
            row["application_number"] ||
            row["App No"];
          const suggestion =
            row["Volunteer Suggestion"] ||
            row["volunteer_suggestion"] ||
            row["Volunteer Note"] ||
            row["Volunteer Remarks"] ||
            row["Suggestion"];

          if (appNum && suggestion !== undefined && suggestion !== null && String(suggestion).trim() !== "") {
            suggestionsToSync.push({
              application_number: String(appNum).trim(),
              suggestion: String(suggestion).trim(),
            });
          }
        });

        if (suggestionsToSync.length === 0) {
          alert("No volunteer suggestions found. Make sure column is 'Volunteer Suggestion'.");
          setIsSyncing(false);
          return;
        }

        setSyncStatusMsg(`Syncing ${suggestionsToSync.length} notes to database...`);
        const res = await adminApi.bulkUpdateVolunteerSuggestions(suggestionsToSync);

        if (res.success) {
          alert(`Successfully synced ${res.updatedCount || suggestionsToSync.length} volunteer suggestions!`);
          await fetchApplications();
          setIsSyncModalOpen(false);
        } else {
          alert(res.message || "Sync failed");
        }
      } catch (err: any) {
        alert("Error parsing file: " + err.message);
      } finally {
        setIsSyncing(false);
        setSyncStatusMsg("");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Sync from Google Sheet link
  const handleGoogleSheetUrlSync = async () => {
    if (!googleSheetUrl.trim()) {
      alert("Please enter a Google Sheet URL.");
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg("Fetching live data from Google Sheets...");

    try {
      let csvUrl = googleSheetUrl.trim();
      if (csvUrl.includes("docs.google.com/spreadsheets/d/")) {
        const match = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          csvUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
      }

      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error("Could not fetch Google Sheet. Make sure link sharing is set to 'Anyone with the link can view'.");
      }

      const csvText = await response.text();
      const wb = XLSX.read(csvText, { type: "string" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      const suggestionsToSync: Array<{ application_number: string; suggestion: string }> = [];
      data.forEach((row) => {
        const appNum =
          row["Application Number"] ||
          row["Application No"] ||
          row["application_number"] ||
          row["App No"];
        const suggestion =
          row["Volunteer Suggestion"] ||
          row["volunteer_suggestion"] ||
          row["Volunteer Note"] ||
          row["Volunteer Remarks"] ||
          row["Suggestion"];

        if (appNum && suggestion !== undefined && suggestion !== null && String(suggestion).trim() !== "") {
          suggestionsToSync.push({
            application_number: String(appNum).trim(),
            suggestion: String(suggestion).trim(),
          });
        }
      });

      if (suggestionsToSync.length === 0) {
        alert("Connected to sheet, but no 'Volunteer Suggestion' entries found.");
        setIsSyncing(false);
        return;
      }

      setSyncStatusMsg(`Syncing ${suggestionsToSync.length} notes...`);
      const res = await adminApi.bulkUpdateVolunteerSuggestions(suggestionsToSync);

      if (res.success) {
        alert(`Success! Synced ${res.updatedCount || suggestionsToSync.length} volunteer notes into database.`);
        await fetchApplications();
        setIsSyncModalOpen(false);
      } else {
        alert(res.message || "Failed to update database");
      }
    } catch (err: any) {
      alert("Google Sheet Sync Error: " + err.message);
    } finally {
      setIsSyncing(false);
      setSyncStatusMsg("");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Yellow & White Sidebar */}
      <AdminSidebar
        activeTab="volunteers"
        applicationsCount={applications.length}
        reviewedCount={volunteerStats.reviewed}
        pendingCount={volunteerStats.pending}
        onSignOutClick={() => setIsSignOutModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-6 flex-1">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                Volunteers Directory & Verification
              </h1>
              <p className="font-primary text-xs sm:text-sm text-black mt-1">
                Manage registered student & alumni volunteers and track applicant telephonic verification.
              </p>
            </div>
          </div>

          {/* SubTab Switcher: Volunteer Directory Grid vs Volunteer Verification Applications */}
          <div className="flex flex-wrap items-center gap-3 border-b border-black/15 pb-3">
            <button
              type="button"
              onClick={() => setActiveSubTab("directory")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md font-heading font-bold text-xs sm:text-sm transition cursor-pointer ${
                activeSubTab === "directory"
                  ? "bg-brand text-black border border-brand font-bold"
                  : "bg-white text-black hover:text-black hover:bg-black/5 border border-black/15"
              }`}
            >
              <UserGroupIcon className="w-4 h-4 stroke-[2.2]" />
              <span>Registered Volunteers Directory</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] ${
                  activeSubTab === "directory"
                    ? "bg-brand/15 text-black font-bold"
                    : "bg-black/5 text-black"
                }`}
              >
                {volunteers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab("verification")}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-md font-heading font-bold text-xs sm:text-sm transition cursor-pointer ${
                activeSubTab === "verification"
                  ? "bg-brand text-black border border-brand font-bold"
                  : "bg-white text-black hover:text-black hover:bg-black/5 border border-black/15"
              }`}
            >
              <DocumentTextIcon className="w-4 h-4 stroke-[2.2]" />
              <span>Volunteer Verification Applications</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] ${
                  activeSubTab === "verification"
                    ? "bg-brand/15 text-black font-bold"
                    : "bg-black/5 text-black"
                }`}
              >
                {candidateApplications.length}
              </span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-black/15 rounded-lg p-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative w-full lg:flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-black/65" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeSubTab === "directory"
                    ? "Search volunteer by name, email, phone, college, company, or skills..."
                    : "Search applicant by name, phone, district, or volunteer suggestion..."
                }
                className="w-full bg-black/5 border border-black/15 rounded-md pl-10 pr-4 py-2.5 text-xs text-black placeholder-black/65 focus:outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 transition"
              />
            </div>

            {/* SubTab Specific Filters */}
            {activeSubTab === "directory" ? (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-black/65">Role:</span>
                <div className="inline-flex rounded-md bg-black/5 p-1 border border-black/15 text-xs font-bold">
                  {(["all", "student", "alumni"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRoleFilter(r)}
                      className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${roleFilter === r
                        ? "bg-white text-black font-bold"
                        : "text-black hover:text-black"
                        }`}
                    >
                      {r === "all" ? "All" : `${r}s`}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-black/65">Review:</span>
                <div className="inline-flex rounded-md bg-black/5 p-1 border border-black/15 text-xs font-bold">
                  {(["all", "reviewed", "pending"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${statusFilter === s
                        ? "bg-white text-black font-bold"
                        : "text-black hover:text-black"
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full lg:w-56 shrink-0 bg-black/5 border border-black/15 rounded-md px-3 py-2.5 text-xs font-semibold text-black focus:outline-none focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/20 transition"
              aria-label="Filter by event"
            >
              <option value="all">All Events</option>
              {events.map((event) => (
                <option key={event.id} value={String(event.id)}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          {assignmentMessage && (
            <div className="rounded-md border border-brand/60 bg-brand/15 px-4 py-3 text-xs font-semibold text-black">
              {assignmentMessage}
            </div>
          )}

          {/* VIEW A: REGISTERED VOLUNTEERS DIRECTORY */}
          {activeSubTab === "directory" && (
            <section className="bg-white border border-black/15 rounded-xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-black/15 flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-base text-black">
                    Registered Foundation Volunteers
                  </h2>
                  <p className="text-xs text-black/65 mt-0.5">
                    Showing {filteredVolunteers.length} of {volunteers.length} registered students & alumni
                  </p>
                </div>
              </div>

              {filteredVolunteers.length === 0 ? (
                <div className="py-20 text-center text-black/65 text-xs space-y-2">
                  <UserGroupIcon className="w-10 h-10 mx-auto text-black/65 stroke-1" />
                  <p className="font-bold text-black">No registered volunteers found</p>
                  <p className="text-black/65">
                    When students or alumni register as volunteers from their portal, their complete details appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-black/5 border-b border-black/15 font-heading font-bold text-black tracking-wider uppercase text-[10px]">
                        <th className="py-3 px-4">Volunteer Name</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Contact Details</th>
                        <th className="py-3 px-4">Affiliation / College</th>
                        <th className="py-3 px-4">Specialization & Skills</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/15">
                      {filteredVolunteers.map((vol, idx) => (
                        <tr key={vol.id || vol.email || idx} className="hover:bg-brand/15 transition">
                          {/* Name & Avatar */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-brand/15 text-black font-bold flex items-center justify-center text-xs shrink-0">
                                {vol.name?.charAt(0) || "V"}
                              </div>
                              <div>
                                <p className="font-bold text-black">{vol.name}</p>
                                <span className="text-[10px] text-black font-bold">
                                  ● Enrolled Volunteer
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider ${(vol.role || "").toLowerCase() === "alumni"
                                ? "bg-brand/15 text-black border border-brand/60"
                                : "bg-brand/15 text-black border border-brand/60"
                                }`}
                            >
                              {vol.role || "Student"}
                            </span>
                          </td>

                          {/* Contact Details */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <a
                                href={`mailto:${vol.email}`}
                                className="text-black hover:text-black flex items-center gap-1 font-mono text-[11px]"
                              >
                                <EnvelopeIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                                <span className="truncate max-w-[180px]">{vol.email}</span>
                              </a>
                              {vol.phone && (
                                <div className="text-black/65 flex items-center gap-1 text-[11px]">
                                  <PhoneIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                                  <span>{vol.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Affiliation / College / Company */}
                          <td className="py-3.5 px-4">
                            <p className="font-semibold text-black line-clamp-1">{vol.college || "—"}</p>
                            <p className="text-[11px] text-black/65 mt-0.5 line-clamp-1">
                              {(vol.role || "").toLowerCase() === "alumni"
                                ? vol.company || vol.designation || vol.department || "Alumni Scholar"
                                : vol.department || vol.year_of_study || "Student Scholar"}
                            </p>
                          </td>

                          {/* Skills */}
                          <td className="py-3.5 px-4 max-w-[240px]">
                            <p className="text-black text-[11px] line-clamp-2 leading-relaxed">
                              {vol.skills || "Applicant Calling, Verification, Event desk"}
                            </p>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleAssignVolunteer(vol)}
                                disabled={assigningVolunteerId === String(vol.id || vol.email)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-brand hover:brightness-95 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <UserGroupIcon className="w-3.5 h-3.5" />
                                <span>
                                  {assigningVolunteerId === String(vol.id || vol.email) ? "Assigning..." : "Assign"}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedVolunteer(vol)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-black bg-black/5 hover:bg-brand hover:text-black transition cursor-pointer"
                              >
                                <EyeIcon className="w-3.5 h-3.5" />
                                <span>Details</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* VIEW B: APPLICANT CALLING VERIFICATION REVIEWS */}
          {activeSubTab === "verification" && (
            <section className="bg-white border border-black/15 rounded-xl overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-black/15 flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-base text-black">
                    Volunteer Verification Reviews
                  </h2>
                  <p className="text-xs text-black/65 mt-0.5">
                    Showing {filteredApplications.length} of {candidateApplications.length} applicants
                  </p>
                </div>
              </div>

              {filteredApplications.length === 0 ? (
                <div className="py-20 text-center text-black/65 text-xs">
                  <DocumentTextIcon className="w-10 h-10 mx-auto text-black/65 mb-2" />
                  <p className="font-bold text-black">No matching records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-black/5 border-b border-black/15 font-heading font-bold text-black tracking-wider uppercase text-[10px]">
                        <th className="py-3 px-4">Application No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Contact Phone</th>
                        <th className="py-3 px-4">District</th>
                        <th className="py-3 px-4">12th Cutoff</th>
                        <th className="py-3 px-4">Volunteer Feedback / Suggestion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/15">
                      {filteredApplications.map((app) => (
                        <tr key={app.id} className="hover:bg-brand/15 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-black">
                            {app.application_number || "MF-2025-001"}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-black">
                            {app.full_name || "—"}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-black">
                            <div className="flex items-center gap-1.5">
                              <PhoneIcon className="w-3.5 h-3.5 text-black/65" />
                              <span>{app.mobile_number || "—"}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-black">
                            {app.district || "—"}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-black">
                            {app.twelfth_cutoff ? (
                              <span className="px-2 py-0.5 bg-brand/15 border border-brand/60 rounded">
                                {app.twelfth_cutoff}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-3.5 px-4 max-w-[320px]">
                            {editingVolunteerId === app.id ? (
                              <div className="flex flex-col gap-1.5">
                                <textarea
                                  value={volunteerNoteInput}
                                  onChange={(e) => setVolunteerNoteInput(e.target.value)}
                                  placeholder="Type volunteer suggestion..."
                                  rows={2}
                                  className="w-full text-xs p-2 bg-white border border-brand/60 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand text-black"
                                />
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVolunteerId(null);
                                      setVolunteerNoteInput("");
                                    }}
                                    className="px-2 py-0.5 text-[10px] text-black/65 hover:text-black"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSavingVolunteerNote}
                                    onClick={() => handleSaveVolunteerNote(app.id)}
                                    className="px-2.5 py-0.5 text-[10px] font-bold bg-brand text-black rounded hover:bg-brand"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : app.volunteer_suggestion ? (
                              <div className="group/note flex items-start justify-between gap-1">
                                <div className="p-2.5 bg-brand/15 border border-brand/60 rounded-md text-black font-medium w-full">
                                  <p className="text-xs leading-relaxed">"{app.volunteer_suggestion}"</p>
                                  {app.volunteer_name && (
                                    <p className="text-[10px] text-black font-bold mt-1">
                                      By: {app.volunteer_name}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingVolunteerId(app.id);
                                    setVolunteerNoteInput(app.volunteer_suggestion || "");
                                  }}
                                  className="opacity-0 group-hover/note:opacity-100 p-1 text-black/65 hover:text-black transition"
                                  title="Edit suggestion"
                                >
                                  <PencilSquareIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVolunteerId(app.id);
                                  setVolunteerNoteInput("");
                                }}
                                className="inline-flex items-center gap-1 text-[11px] text-black/65 hover:text-black font-medium py-1 px-2 rounded hover:bg-brand/15 transition border border-dashed border-black/15 hover:border-brand/60 w-full justify-center"
                              >
                                <ChatBubbleLeftEllipsisIcon className="w-3 h-3 text-black/65" />
                                <span>+ Add Volunteer Suggestion</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {/* Sync Volunteer Notes Modal */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-sm border border-black/15 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-black/15">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-brand/15 text-black rounded-md">
                  <ArrowUpTrayIcon className="w-5 h-5 stroke-[2.2]" />
                </span>
                <div>
                  <h3 className="font-heading font-bold text-base text-black">
                    Sync Volunteer Suggestions
                  </h3>
                  <p className="text-xs text-black/65">
                    Pull volunteer feedback into the dashboard
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSyncModalOpen(false);
                  setSyncStatusMsg("");
                }}
                className="p-1 text-black/65 hover:text-black rounded-lg hover:bg-black/5 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Google Sheets Link */}
            <div className="p-4 bg-black/5 border border-black/15 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">1</span>
                <span className="font-heading font-bold text-xs text-black uppercase tracking-wide">
                  Option A: Live Sync via Google Sheets Link
                </span>
              </div>
              <p className="text-xs text-black leading-relaxed">
                Paste the shared Google Sheet URL below to automatically pull all comments:
              </p>
              <div className="space-y-2">
                <input
                  type="url"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                  className="w-full text-xs p-2.5 bg-white border border-black/15 rounded-md focus:outline-none focus:ring-2 focus:ring-brand text-black font-medium"
                />
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleGoogleSheetUrlSync}
                  className="w-full py-2 px-3 text-xs font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? "Syncing..." : "Sync from Google Sheet Link"}
                </button>
              </div>
            </div>

            {/* File Upload */}
            <div className="p-4 bg-black/5 border border-black/15 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">2</span>
                <span className="font-heading font-bold text-xs text-black uppercase tracking-wide">
                  Option B: Upload Volunteer Excel / CSV File
                </span>
              </div>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-black/15 hover:border-brand bg-white rounded-md cursor-pointer transition">
                <TableCellsIcon className="w-7 h-7 text-black/65 mb-1" />
                <span className="text-xs font-bold text-black">Choose Filled Excel / CSV File</span>
                <span className="text-[10px] text-black/65">.xlsx, .xls, or .csv</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUploadSync}
                  className="hidden"
                />
              </label>
            </div>

            {syncStatusMsg && (
              <p className="text-xs text-center font-bold text-black animate-pulse">
                {syncStatusMsg}
              </p>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsSyncModalOpen(false);
                  setSyncStatusMsg("");
                }}
                className="px-4 py-2 text-xs font-bold text-black hover:bg-black/5 rounded-md transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {volunteerPendingAssignment && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-black">
                <UserGroupIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-black">
                  Confirm Application Assignment
                </h3>
                <p className="mt-1 text-sm leading-5 text-black">
                  Select a registered student application to assign to{" "}
                  <strong className="text-black">
                    {volunteerPendingAssignment.name || volunteerPendingAssignment.email}
                  </strong>
                  .
                </p>
              </div>
            </div>
            <div className="mt-5 max-h-80 space-y-2 overflow-y-auto">
              {candidateApplications.length === 0 ? (
                <p className="rounded-md border border-dashed border-black/15 bg-black/5 p-6 text-center text-xs text-black/65">
                  No registered student applications are available.
                </p>
              ) : (
                candidateApplications.map((application) => {
                  const isSelected = String(selectedApplicationId) === String(application.id);
                  return (
                    <button
                      key={application.id}
                      type="button"
                      onClick={() => setSelectedApplicationId(String(application.id))}
                      className={`w-full rounded-md border p-3 text-left transition ${
                        isSelected
                          ? "border-brand bg-brand/15 ring-2 ring-brand"
                          : "border-black/15 bg-white hover:border-brand/60 hover:bg-brand/15"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-black">
                            {application.full_name || "Unnamed Student"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-black/65">
                            {application.application_number || "Application"} · {application.district || "District not provided"}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-black">
                          {application.preferred_degree || application.twelfth_stream || "Applicant"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setVolunteerPendingAssignment(null)}
                disabled={Boolean(assigningVolunteerId)}
                className="rounded-md border border-black/15 px-4 py-2.5 text-xs font-bold text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmAssignVolunteer()}
                disabled={Boolean(assigningVolunteerId) || !selectedApplicationId}
                className="rounded-md bg-brand px-4 py-2.5 text-xs font-bold text-black transition hover:bg-brand disabled:cursor-not-allowed disabled:opacity-60"
              >
                {assigningVolunteerId ? "Assigning..." : "Assign Selected Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Volunteer Details Modal */}
      {selectedVolunteer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 sm:p-7 shadow-sm space-y-6 max-h-[90vh] overflow-y-auto border border-black/15">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/15">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-brand/15 text-black font-bold flex items-center justify-center text-sm border border-brand/60">
                  {selectedVolunteer.name?.charAt(0) || "V"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-lg text-black">
                      {selectedVolunteer.name}
                    </h3>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider ${(selectedVolunteer.role || "").toLowerCase() === "alumni"
                        ? "bg-brand/15 text-black border border-brand/60"
                        : "bg-brand/15 text-black border border-brand/60"
                        }`}
                    >
                      {selectedVolunteer.role || "Student"}
                    </span>
                  </div>
                  <p className="text-xs text-black/65 mt-0.5">
                    Registered Foundation Volunteer Details
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedVolunteer(null)}
                className="p-1.5 text-black/65 hover:text-black rounded-md hover:bg-black/5 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-black/5 border border-black/15">
                <span className="text-[10px] text-black/65 font-bold uppercase block">Email Address</span>
                <a
                  href={`mailto:${selectedVolunteer.email}`}
                  className="font-mono text-black hover:text-black font-medium mt-1 block truncate"
                >
                  {selectedVolunteer.email}
                </a>
              </div>

              <div className="p-3.5 rounded-lg bg-black/5 border border-black/15">
                <span className="text-[10px] text-black/65 font-bold uppercase block">Contact Phone</span>
                <span className="font-medium text-black mt-1 block">
                  {selectedVolunteer.phone || "—"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-black/5 border border-black/15">
                <span className="text-[10px] text-black/65 font-bold uppercase block">College / Institution</span>
                <span className="font-medium text-black mt-1 block">
                  {selectedVolunteer.college || "—"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-black/5 border border-black/15">
                <span className="text-[10px] text-black/65 font-bold uppercase block">Department / Degree</span>
                <span className="font-medium text-black mt-1 block">
                  {selectedVolunteer.department || "—"}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-black/5 border border-black/15">
                <span className="text-[10px] text-black/65 font-bold uppercase block">Year / Batch</span>
                <span className="font-medium text-black mt-1 block">
                  {selectedVolunteer.batch || selectedVolunteer.year_of_study || "—"}
                </span>
              </div>

              {(selectedVolunteer.role || "").toLowerCase() === "alumni" && (
                <div className="p-3.5 rounded-lg bg-black/5 border border-black/15">
                  <span className="text-[10px] text-black/65 font-bold uppercase block">Current Company / Role</span>
                  <span className="font-medium text-black mt-1 block">
                    {selectedVolunteer.company || selectedVolunteer.designation || "Leading Tech Firm"}
                  </span>
                </div>
              )}
            </div>

            {/* Specialization & Skills */}
            <div className="p-4 rounded-lg bg-brand/15 border border-brand/60 space-y-1.5">
              <span className="text-[10px] text-black font-bold uppercase tracking-wide block">
                Volunteer Specialization & Skills
              </span>
              <p className="text-xs text-black leading-relaxed font-medium">
                {selectedVolunteer.skills || "Telephonic Calling, Socio-economic verification, Event desks, Mentorship"}
              </p>
            </div>

            {selectedVolunteer.registered_at && (
              <div className="text-[11px] text-black/65 font-mono">
                Registered on: {new Date(selectedVolunteer.registered_at).toLocaleString()}
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedVolunteer(null)}
                className="px-5 py-2.5 rounded-md text-xs font-heading font-bold text-black bg-black/5 hover:bg-black/10 transition cursor-pointer"
               >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Admin Sign Out"
        description="Are you sure you want to sign out of the Maatram Admin Portal?"
      />
    </div>
  );
}
