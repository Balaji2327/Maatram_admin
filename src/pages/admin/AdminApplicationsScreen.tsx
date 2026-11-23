"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowLeftOnRectangleIcon,
  ArrowLeftIcon,
  EyeIcon,
  PencilSquareIcon,
  XMarkIcon,
  AcademicCapIcon,
  UserIcon,
  HomeModernIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ShieldCheckIcon,
  BuildingLibraryIcon,
  ArrowUpTrayIcon,
  ChatBubbleLeftEllipsisIcon,
  TableCellsIcon,
  CheckBadgeIcon,
  ArrowTopRightOnSquareIcon,
  UserPlusIcon,
  XCircleIcon,
  VideoCameraIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  PhotoIcon,
  CameraIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import * as XLSX from "xlsx";
import { adminApi, getAdminToken, getAdminCachedData, setAdminCachedData } from "../../lib/api";
import SignOutModal from "../../components/SignOutModal";
import AdminSidebar, { AdminTab } from "../../components/AdminSidebar";

// 5 Mandatory Photos for Physical Verification
const PHYSICAL_PHOTO_SLOTS = [
  { key: "front_view_home", title: "Front view of the home" },
  { key: "inside_home", title: "Inside home" },
  { key: "furniture", title: "Furniture" },
  { key: "with_student", title: "With student" },
  { key: "backward", title: "Backward" },
];

// Default Active Volunteers Roster for Televerification
const DEFAULT_VOLUNTEERS = [
  {
    id: "vol-1",
    name: "Karthik Raja",
    email: "karthik.alumni@maatram.org",
    role: "alumni",
    phone: "9840123456",
    company: "Zoho Corporation",
    designation: "Senior Software Engineer",
    batch: "2018 - 2022",
    assigned_count: 3,
  },
  {
    id: "vol-2",
    name: "Priyadharshini S",
    email: "priya.alumni@maatram.org",
    role: "alumni",
    phone: "9789123456",
    company: "Tata Consultancy Services",
    designation: "Systems Engineer",
    batch: "2019 - 2023",
    assigned_count: 5,
  },
  {
    id: "vol-3",
    name: "Vigneshwaran M",
    email: "vignesh.student@maatram.org",
    role: "student",
    phone: "9444123456",
    college: "Anna University (CEG)",
    department: "Mechanical Engineering",
    year_of_study: "Final Year",
    assigned_count: 2,
  },
  {
    id: "vol-4",
    name: "Ananya Ramesh",
    email: "ananya.student@maatram.org",
    role: "student",
    phone: "9884123456",
    college: "PSG College of Technology",
    department: "Electronics & Communication",
    year_of_study: "3rd Year",
    assigned_count: 1,
  },
  {
    id: "vol-5",
    name: "Saravanan K",
    email: "saravanan.alumni@maatram.org",
    role: "alumni",
    phone: "9600123456",
    company: "Freshworks",
    designation: "Product Associate",
    batch: "2017 - 2021",
    assigned_count: 4,
  },
];

export default function AdminApplicationsScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Authentication Guard
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
    }
  }, [router]);

  // Data states
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    draft: 0,
    under_review: 0,
    shortlisted: 0,
    selected: 0,
    rejected: 0,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "cutoff" | "name">("newest");
  const [activeTab, setActiveTab] = useState<AdminTab>("applications");

  // Detail View state (Full-Page Document View)
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [isRestoringApplicant, setIsRestoringApplicant] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusUpdateMessage, setStatusUpdateMessage] = useState("");
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  // Volunteer Suggestions & Sync States
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState("");
  const [editingVolunteerId, setEditingVolunteerId] = useState<string | null>(null);
  const [volunteerNoteInput, setVolunteerNoteInput] = useState("");
  const [volunteerStudentDescriptionInput, setVolunteerStudentDescriptionInput] = useState("");
  const [adminPhysicalPhotos, setAdminPhysicalPhotos] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [isSavingVolunteerNote, setIsSavingVolunteerNote] = useState(false);

  // Helper for admin photo upload & compression
  const compressAdminImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new (window as any).Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    });
  };

  const handleAdminPhotoUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressAdminImage(file);
      setAdminPhysicalPhotos((prev) => ({ ...prev, [key]: base64 }));
    } catch (err) {
      console.error("Admin photo upload error:", err);
    }
  };

  const handleAdminRemovePhoto = (key: string) => {
    setAdminPhysicalPhotos((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Volunteer Televerification & Physical Verification Assignment Modal States
  const [isAssignVolunteerModalOpen, setIsAssignVolunteerModalOpen] = useState(false);
  const [assignVolunteerPhase, setAssignVolunteerPhase] = useState<"televerification" | "physical">("televerification");
  const [volunteersList, setVolunteersList] = useState<any[]>([]);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState(false);
  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState("");
  const [volunteerRoleFilter, setVolunteerRoleFilter] = useState<"all" | "alumni" | "student">("all");
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string | null>(null);
  const [isAssigningVolunteer, setIsAssigningVolunteer] = useState(false);

  // Reject Application Modal States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAdvancingPhase, setIsAdvancingPhase] = useState(false);

  const openVolunteerAssignment = async (phase: "televerification" | "physical" = "televerification") => {
    setAssignVolunteerPhase(phase);
    setSelectedVolunteerId(null);
    setVolunteerSearchQuery("");
    setVolunteerRoleFilter("all");
    setIsAssignVolunteerModalOpen(true);

    // Immediate check against session cache or current eventsList to pick the best matching event
    let currentEvents = eventsList;
    if (!currentEvents || currentEvents.length === 0) {
      try {
        const cached = sessionStorage.getItem("maatram_admin_events_cache");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentEvents = parsed;
            setEventsList(parsed);
          }
        }
      } catch {}
    }

    const applicantEventId =
      phase === "physical"
        ? (selectedApplicant?.physical_event_id || selectedApplicant?.event_id)
        : (selectedApplicant?.tele_event_id || selectedApplicant?.event_id);

    const applicantEventTitle =
      phase === "physical"
        ? (selectedApplicant?.physical_event_title || selectedApplicant?.event_title)
        : (selectedApplicant?.tele_event_title || selectedApplicant?.event_title);

    const matched = currentEvents.find((ev) =>
      (applicantEventId && String(ev.id) === String(applicantEventId)) ||
      (applicantEventTitle && (
        ev.title?.toLowerCase() === String(applicantEventTitle).toLowerCase() ||
        ev.name?.toLowerCase() === String(applicantEventTitle).toLowerCase()
      ))
    ) || currentEvents[0];

    if (matched) {
      setSelectedEventId(String(matched.id));
    } else {
      setSelectedEventId("");
    }

    await Promise.all([loadVolunteers(), loadEvents()]);
  };

  const selectedApplicantRef = useRef<any | null>(null);
  useEffect(() => {
    selectedApplicantRef.current = selectedApplicant;
  }, [selectedApplicant]);

  // Fetch all applications
  const fetchApplications = async () => {
    setIsRefreshing(true);
    setErrorMessage("");
    try {
      const res = await adminApi.getApplications();
      if (res.success && res.data) {
        setApplications(res.data);
        setAdminCachedData("applications", res);
        if (res.stats) setStats(res.stats);

        // Check if an applicant ID was in the URL or sessionStorage or currently selected
        const currentTargetId =
          searchParams?.get("applicantId") ||
          searchParams?.get("id") ||
          (typeof window !== "undefined" ? sessionStorage.getItem("admin_selected_applicant_id") : null) ||
          selectedApplicantRef.current?.id ||
          selectedApplicantRef.current?.application_number;

        if (currentTargetId) {
          const found = res.data.find(
            (a: any) =>
              String(a.id) === String(currentTargetId) ||
              String(a.application_number) === String(currentTargetId)
          );
          if (found) {
            setSelectedApplicant(found);
          } else {
            // Try fetching by ID directly if not in list
            try {
              const singleRes = await adminApi.getApplicationById(currentTargetId);
              if (singleRes.success && singleRes.data) {
                setSelectedApplicant(singleRes.data);
              }
            } catch {
              // Ignore if not found
            }
          }
        }
      } else {
        setErrorMessage(res.message || "Failed to load applications");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error loading applications");
    } finally {
      setIsRefreshing(false);
      setIsRestoringApplicant(false);
    }
  };

  useEffect(() => {
    const urlApplicantId =
      searchParams?.get("applicantId") ||
      searchParams?.get("id") ||
      (typeof window !== "undefined" ? sessionStorage.getItem("admin_selected_applicant_id") : null);

    if (urlApplicantId) {
      setIsRestoringApplicant(true);
    }

    const cachedApplications = getAdminCachedData<any>("applications")?.data;
    if (cachedApplications) setApplications(cachedApplications);

    fetchApplications();
    loadEvents();

    const handleFocus = () => {
      fetchApplications();
    };
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(() => {
      fetchApplications();
    }, 10000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [searchParams]);

  // Helper to open applicant details and persist in URL & sessionStorage
  const handleSelectApplicant = (app: any) => {
    setSelectedApplicant(app);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("admin_selected_applicant_id", app.id);
      const url = new URL(window.location.href);
      url.searchParams.set("applicantId", app.id);
      window.history.replaceState({}, "", url.toString());
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Helper to close applicant details and remove from URL & sessionStorage
  const handleCloseApplicant = () => {
    setSelectedApplicant(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("admin_selected_applicant_id");
      const url = new URL(window.location.href);
      url.searchParams.delete("applicantId");
      url.searchParams.delete("id");
      window.history.replaceState({}, "", url.toString());
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Unique district list for filter dropdown
  const districtList = useMemo(() => {
    const set = new Set<string>();
    applications.forEach((a) => {
      if (a.district && a.district.trim()) {
        set.add(a.district.trim());
      }
    });
    return Array.from(set).sort();
  }, [applications]);

  // Filter & Search logic
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    // District filter
    if (districtFilter !== "all") {
      result = result.filter(
        (a) => a.district && a.district.toLowerCase() === districtFilter.toLowerCase()
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(q) ||
          a.application_number?.toLowerCase().includes(q) ||
          a.mobile_number?.includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          a.district?.toLowerCase().includes(q) ||
          a.preferred_branch?.toLowerCase().includes(q)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "cutoff") {
        const cutoffA = parseFloat(a.twelfth_cutoff) || 0;
        const cutoffB = parseFloat(b.twelfth_cutoff) || 0;
        return cutoffB - cutoffA;
      }
      if (sortBy === "name") {
        return (a.full_name || "").localeCompare(b.full_name || "");
      }
      // Newest first default
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [applications, statusFilter, districtFilter, searchQuery, sortBy]);

  // Handle Status Update
  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      setIsUpdatingStatus(true);
      const res = await adminApi.updateStatus(appId, newStatus);

      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        );
        if (selectedApplicant && selectedApplicant.id === appId) {
          setSelectedApplicant((prev: any) => ({ ...prev, status: newStatus }));
        }
        setStatusUpdateMessage(`Application status updated to ${newStatus.toUpperCase()}`);
        setTimeout(() => setStatusUpdateMessage(""), 4000);
      } else {
        alert(res.message || "Failed to update status");
      }
    } catch (err: any) {
      alert("Error updating application status: " + err.message);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Load registered volunteers from backend (with default fallback)
  const loadVolunteers = async () => {
    setIsLoadingVolunteers(true);
    try {
      const res = await adminApi.getRegisteredVolunteers();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setVolunteersList(res.data);
      } else {
        setVolunteersList(DEFAULT_VOLUNTEERS);
      }
    } catch {
      setVolunteersList(DEFAULT_VOLUNTEERS);
    } finally {
      setIsLoadingVolunteers(false);
    }
  };

  const loadEvents = async () => {
    try {
      const res = await adminApi.getEvents();
      if (res.success && Array.isArray(res.data)) {
        setEventsList(res.data);
        if (
          !selectedEventId ||
          !res.data.some((event: any) => String(event.id) === String(selectedEventId))
        ) {
          setSelectedEventId(res.data[0]?.id ? String(res.data[0].id) : "");
        }
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("maatram_admin_events_cache", JSON.stringify(res.data));
          } catch {}
        }
      }
    } catch (err) {
      console.error("Failed to load events for volunteer assignment:", err);
    }
  };

  // Only events returned by the backend are available for assignment, filtered by phase
  const phaseEvents = useMemo(() => {
    if (!Array.isArray(eventsList)) return [];
    if (assignVolunteerPhase === "physical") {
      const physicalMatches = eventsList.filter((ev: any) => {
        const text = `${ev.title || ""} ${ev.name || ""} ${ev.category || ""} ${ev.description || ""} ${ev.mode || ""}`.toLowerCase();
        return (
          text.includes("physical") ||
          text.includes("field") ||
          text.includes("home visit") ||
          text.includes("in-person") ||
          text.includes("offline")
        );
      });
      return physicalMatches.length > 0 ? physicalMatches : eventsList;
    } else {
      const teleMatches = eventsList.filter((ev: any) => {
        const text = `${ev.title || ""} ${ev.name || ""} ${ev.category || ""} ${ev.description || ""} ${ev.mode || ""}`.toLowerCase();
        return (
          text.includes("tele") ||
          text.includes("calling") ||
          text.includes("remote") ||
          text.includes("online")
        );
      });
      return teleMatches.length > 0 ? teleMatches : eventsList;
    }
  }, [eventsList, assignVolunteerPhase]);

  // Filtered volunteers for assignment modal
  const filteredVolunteers = useMemo(() => {
    let list = volunteersList.length > 0 ? [...volunteersList] : [...DEFAULT_VOLUNTEERS];

    const getAssignmentMap = (event: any) =>
      event.volunteer_assignments ||
      event.volunteerAssignments ||
      event.assignments ||
      {};

    const getRegisteredEntries = (event: any) => [
      ...(event.accepted_students || event.acceptedStudents || []),
      ...(event.accepted_alumni || event.acceptedAlumni || []),
      ...(event.accepted_volunteers || event.acceptedVolunteers || []),
      ...(event.registered_volunteers || event.registeredVolunteers || []),
      ...(event.participants || event.volunteers || []),
    ];

    const getEntryKeys = (entry: any) => {
      if (typeof entry === "string") return [entry.toLowerCase().trim()];
      return [
        entry?.id,
        entry?.volunteer_id,
        entry?.user_id,
        entry?.email,
        entry?.volunteer_email,
        entry?.name,
      ].filter(Boolean).map((value: unknown) => String(value).toLowerCase().trim());
    };

    if (!selectedEventId) {
      return [];
    }

    // Filter strictly by the chosen event from the dropdown
    if (selectedEventId && selectedEventId !== "general_pool") {
      if (selectedEventId === "all") {
        // Show volunteers registered across any phase event
        const targetEvents = phaseEvents.length > 0 ? phaseEvents : eventsList;
        const allRegisteredEntries = targetEvents.flatMap(getRegisteredEntries);
        const allRegisteredKeys = allRegisteredEntries.flatMap(getEntryKeys);
        const allAssignedEmails = targetEvents
          .flatMap((ev) => Object.keys(getAssignmentMap(ev)))
          .map((em) => em.toLowerCase().trim());

        // Synthesize any registered entry not already in list
        const existingEmails = new Set(list.map((v) => (v.email || "").toLowerCase().trim()));
        allRegisteredEntries.forEach((entry: any) => {
          const entryEmail = (entry.email || entry.volunteer_email || (typeof entry === "string" ? entry : "")).toLowerCase().trim();
          if (entryEmail && !existingEmails.has(entryEmail)) {
            existingEmails.add(entryEmail);
            list.push({
              id: entry.id || entry.user_id || `vol_ev_${entryEmail}`,
              name: entry.name || entryEmail.split("@")[0] || "Registered Volunteer",
              email: entryEmail,
              phone: entry.phone || "+91 98765 43210",
              college: entry.college || "Anna University",
              department: entry.department || "Engineering",
              role: entry.role || "student",
              year_of_study: entry.year_of_study || entry.year || "1st Year",
            });
          }
        });

        if (allRegisteredKeys.length > 0 || allAssignedEmails.length > 0) {
          list = list.filter((volunteer) => {
            const volunteerKeys = [
              volunteer.id,
              volunteer.user_id,
              volunteer.email,
              volunteer.name,
            ].filter(Boolean).map((value: unknown) => String(value).toLowerCase().trim());
            return volunteerKeys.some(
              (key) => allRegisteredKeys.includes(key) || allAssignedEmails.includes(key)
            );
          });
        }
      } else {
        // A specific event is selected from the dropdown: THAT event alone's registered volunteers will show!
        const chosenEvent = eventsList.find((ev) => String(ev.id) === String(selectedEventId));
        if (chosenEvent) {
          const registeredEntries = getRegisteredEntries(chosenEvent);
          const registeredKeys = registeredEntries.flatMap(getEntryKeys);
          const assignedVolunteerEmails = Object.keys(getAssignmentMap(chosenEvent))
            .map((email) => email.toLowerCase().trim());

          // Synthesize any registered entry from this event not yet in list
          const existingEmails = new Set(list.map((v) => (v.email || "").toLowerCase().trim()));
          registeredEntries.forEach((entry: any) => {
            const entryEmail = (entry.email || entry.volunteer_email || (typeof entry === "string" ? entry : "")).toLowerCase().trim();
            if (entryEmail && !existingEmails.has(entryEmail)) {
              existingEmails.add(entryEmail);
              list.push({
                id: entry.id || entry.user_id || `vol_ev_${entryEmail}`,
                name: entry.name || entryEmail.split("@")[0] || "Registered Volunteer",
                email: entryEmail,
                phone: entry.phone || "+91 98765 43210",
                college: entry.college || "Anna University",
                department: entry.department || "Engineering",
                role: entry.role || (chosenEvent.accepted_alumni?.some((a: any) => (a.email || a) === entryEmail) ? "alumni" : "student"),
                year_of_study: entry.year_of_study || entry.year || "1st Year",
              });
            }
          });

          list = list.filter((volunteer) => {
            const volunteerKeys = [
              volunteer.id,
              volunteer.user_id,
              volunteer.email,
              volunteer.name,
            ].filter(Boolean).map((value: unknown) => String(value).toLowerCase().trim());
            return volunteerKeys.some(
              (key) => registeredKeys.includes(key) || assignedVolunteerEmails.includes(key)
            );
          });
        } else {
          list = [];
        }
      }
    }

    if (volunteerRoleFilter !== "all") {
      list = list.filter((v) => v.role?.toLowerCase() === volunteerRoleFilter);
    }
    if (volunteerSearchQuery.trim()) {
      const q = volunteerSearchQuery.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.name?.toLowerCase().includes(q) ||
          v.email?.toLowerCase().includes(q) ||
          v.phone?.includes(q) ||
          v.company?.toLowerCase().includes(q) ||
          v.college?.toLowerCase().includes(q) ||
          v.designation?.toLowerCase().includes(q) ||
          v.department?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [volunteersList, volunteerRoleFilter, volunteerSearchQuery, selectedEventId, phaseEvents, eventsList]);

  // Handle Volunteer Assignment
  const handleAssignVolunteer = async () => {
    if (!selectedApplicant || !selectedVolunteerId) return;
    const vol = (volunteersList.length > 0 ? volunteersList : DEFAULT_VOLUNTEERS).find(
      (v) => String(v.id) === String(selectedVolunteerId)
    ) || filteredVolunteers.find((v) => String(v.id) === String(selectedVolunteerId));
    if (!vol) return;

    setIsAssigningVolunteer(true);
    try {
      const volAffiliation = vol.company || vol.college || (vol.role === "alumni" ? "Maatram Alumni Network" : "Maatram Scholar");
      const volRole = vol.role === "alumni" ? "Alumni Volunteer" : "Student Volunteer";

      const selectedEv = eventsList.find((ev) => String(ev.id) === String(selectedEventId));
      const eventIdToAssign = selectedEv ? String(selectedEv.id) : undefined;
      const eventTitleToAssign = selectedEv ? (selectedEv.title || selectedEv.name) : undefined;

      if (assignVolunteerPhase === "physical") {
        const nextStatus = "physical_verification_in_progress";
        await adminApi.assignVolunteer(selectedApplicant.id, {
          phase: "physical",
          name: vol.name,
          email: vol.email || "",
          phone: vol.phone || "",
          role: volRole,
          affiliation: volAffiliation,
          eventId: eventIdToAssign,
          eventTitle: eventTitleToAssign,
        });

        const updatedApp = {
          ...selectedApplicant,
          status: nextStatus,
          current_stage: "Phase 2: Physical Verification",
          stage_status: "Physical Verification In Progress",
          physical_volunteer_name: vol.name,
          physical_volunteer_email: vol.email || "",
          physical_volunteer_phone: vol.phone || "",
          physical_volunteer_role: volRole,
          physical_volunteer_affiliation: volAffiliation,
          physical_event_id: eventIdToAssign || selectedApplicant.physical_event_id,
          physical_event_title: eventTitleToAssign || selectedApplicant.physical_event_title,
          event_id: eventIdToAssign || selectedApplicant.event_id,
          event_title: eventTitleToAssign || selectedApplicant.event_title,
        };

        setSelectedApplicant(updatedApp);
        setApplications((prev) =>
          prev.map((a) => (a.id === selectedApplicant.id ? updatedApp : a))
        );

        if (typeof window !== "undefined") {
          const keysToSync = [
            selectedApplicant.email,
            selectedApplicant.mobile_number,
            selectedApplicant.user_id,
            selectedApplicant.id,
            selectedApplicant.application_number,
          ].filter(Boolean);

          keysToSync.forEach((k) => {
            window.localStorage.setItem(`maatram_application_status_${k}`, nextStatus);
            window.localStorage.setItem(`maatram_application_stage_${k}`, "Phase 2: Physical Verification");
            window.localStorage.setItem(`maatram_application_stagestatus_${k}`, "Physical Verification In Progress");
          });
          window.localStorage.setItem("maatram_application_status_latest", nextStatus);
          window.localStorage.setItem("maatram_application_stage_latest", "Phase 2: Physical Verification");
          window.localStorage.setItem("maatram_application_stagestatus_latest", "Physical Verification In Progress");
        }

        setStatusUpdateMessage(`Volunteer ${vol.name} successfully assigned for Physical Verification!`);
      } else {
        let nextStatus = selectedApplicant.status;
        if (selectedApplicant.status === "submitted" || selectedApplicant.status === "draft") {
          nextStatus = "under_review";
        }

        await adminApi.assignVolunteer(selectedApplicant.id, {
          phase: "tele",
          name: vol.name,
          email: vol.email || "",
          phone: vol.phone || "",
          role: volRole,
          affiliation: volAffiliation,
          eventId: eventIdToAssign,
          eventTitle: eventTitleToAssign,
        });

        const updatedApp = {
          ...selectedApplicant,
          status: nextStatus,
          current_stage: "Phase 1: Televerification",
          stage_status: "Televerification In Progress",
          volunteer_name: vol.name,
          tele_volunteer_name: vol.name,
          tele_volunteer_email: vol.email || "",
          tele_volunteer_phone: vol.phone || "",
          tele_volunteer_role: volRole,
          tele_volunteer_affiliation: volAffiliation,
          tele_event_id: eventIdToAssign || selectedApplicant.tele_event_id,
          tele_event_title: eventTitleToAssign || selectedApplicant.tele_event_title,
          event_id: eventIdToAssign || selectedApplicant.event_id,
          event_title: eventTitleToAssign || selectedApplicant.event_title,
        };

        setSelectedApplicant(updatedApp);
        setApplications((prev) =>
          prev.map((a) => (a.id === selectedApplicant.id ? updatedApp : a))
        );

        if (typeof window !== "undefined") {
          const keysToSync = [
            selectedApplicant.email,
            selectedApplicant.mobile_number,
            selectedApplicant.user_id,
            selectedApplicant.id,
            selectedApplicant.application_number,
          ].filter(Boolean);

          keysToSync.forEach((k) => {
            window.localStorage.setItem(`maatram_application_status_${k}`, nextStatus);
            window.localStorage.setItem(`maatram_application_stage_${k}`, "Phase 1: Televerification");
            window.localStorage.setItem(`maatram_application_stagestatus_${k}`, "Televerification In Progress");
          });
          window.localStorage.setItem("maatram_application_status_latest", nextStatus);
          window.localStorage.setItem("maatram_application_stage_latest", "Phase 1: Televerification");
          window.localStorage.setItem("maatram_application_stagestatus_latest", "Televerification In Progress");
        }

        setStatusUpdateMessage(`Volunteer ${vol.name} successfully assigned for Televerification!`);
      }

      setTimeout(() => setStatusUpdateMessage(""), 5000);
      setIsAssignVolunteerModalOpen(false);
      setSelectedVolunteerId(null);
    } catch (err: any) {
      alert("Error assigning volunteer: " + (err.message || "Unknown error"));
    } finally {
      setIsAssigningVolunteer(false);
    }
  };

  // Helper to determine the next phase action based on current applicant status:
  // Phase 1: Televerification
  // Phase 2: Physical Verification
  // Phase 3: Video Call Interview
  // Phase 4: Direct Interview (Final Stage)
  const getNextPhaseAction = (status: string) => {
    switch (status) {
      case "submitted":
      case "under_review":
      case "draft":
        return {
          nextStatus: "telephonic_done",
          buttonText: "Move to Phase 2 (Physical Verification)",
          icon: HomeModernIcon,
          badgeText: "Phase 1: Televerification Cleared",
          nextStage: "Phase 2: Physical Verification",
          nextStageStatus: "Waiting for Physical Verification",
        };
      case "telephonic_done":
      case "televerification_done":
      case "physical_verification_in_progress":
        return {
          nextStatus: "physical_verification_done",
          buttonText: "Move to Phase 3 (Video Call Interview)",
          icon: VideoCameraIcon,
          badgeText: "Phase 2: Physical Verification Cleared",
          nextStage: "Phase 3: Video Call Interview",
          nextStageStatus: "Waiting for Video Call Interview",
        };
      case "physical_verification_done":
      case "home_visit_done":
      case "video_interview_in_progress":
        return {
          nextStatus: "video_interview_done",
          buttonText: "Move to Phase 4 (Direct Interview - Final Stage)",
          icon: BuildingLibraryIcon,
          badgeText: "Phase 3: Video Call Interview Cleared",
          nextStage: "Phase 4: Direct Interview",
          nextStageStatus: "Waiting for Direct Interview (Final Stage)",
        };
      case "video_interview_done":
      case "shortlisted":
      case "direct_interview_in_progress":
      case "direct_interview_done":
        return {
          nextStatus: "selected",
          buttonText: "Approve & Award Scholarship (Final Selection)",
          icon: CheckBadgeIcon,
          badgeText: "Phase 4: Direct Interview Cleared",
          nextStage: "Final Selection",
          nextStageStatus: "Scholarship Awarded",
        };
      default:
        return null;
    }
  };

  // Handle Move to Next Phase (Sequential progression across 4 phases)
  const handleMoveNextPhase = async () => {
    if (!selectedApplicant) return;
    const action = getNextPhaseAction(selectedApplicant.status);
    if (!action) return;

    setIsAdvancingPhase(true);
    try {
      const res = await adminApi.updateStatus(selectedApplicant.id, action.nextStatus);
      if (res.success) {
        const updatedApp = {
          ...selectedApplicant,
          status: action.nextStatus,
          current_stage: action.nextStage,
          stage_status: action.nextStageStatus,
        };

        setSelectedApplicant(updatedApp);
        setApplications((prev) =>
          prev.map((a) => (a.id === selectedApplicant.id ? updatedApp : a))
        );

        // Optimistically sync to localStorage for instantaneous student dashboard transition
        if (typeof window !== "undefined") {
          const keysToSync = [
            selectedApplicant.email,
            selectedApplicant.mobile_number,
            selectedApplicant.user_id,
            selectedApplicant.id,
            selectedApplicant.application_number,
          ].filter(Boolean);

          keysToSync.forEach((k) => {
            window.localStorage.setItem(`maatram_application_status_${k}`, action.nextStatus);
            window.localStorage.setItem(`maatram_application_stage_${k}`, action.nextStage);
            window.localStorage.setItem(`maatram_application_stagestatus_${k}`, action.nextStageStatus);
          });
          window.localStorage.setItem("maatram_application_status_latest", action.nextStatus);
          window.localStorage.setItem("maatram_application_stage_latest", action.nextStage);
          window.localStorage.setItem("maatram_application_stagestatus_latest", action.nextStageStatus);
        }

        setStatusUpdateMessage(
          `Application ${selectedApplicant.application_number} advanced: ${action.buttonText}!`
        );
        setTimeout(() => setStatusUpdateMessage(""), 5000);
      } else {
        alert(res.message || "Failed to advance application phase");
      }
    } catch (err: any) {
      alert("Error moving to next phase: " + (err.message || "Unknown error"));
    } finally {
      setIsAdvancingPhase(false);
    }
  };

  // Handle Reject Application
  const handleConfirmReject = async () => {
    if (!selectedApplicant) return;
    setIsRejecting(true);
    try {
      const defaultReason = rejectionReason.trim() || "Application not shortlisted based on verification criteria.";

      // Determine rejection stage across the 4 phases:
      // 1: Initial Application Review
      // 2: First Phase: Televerification
      // 3: Second Phase: Physical Verification
      // 4: Third Phase: Video Call Interview
      // 5: Fourth Phase: Direct Interview (Final Stage)
      const currentStatus = selectedApplicant.status;
      let rejectionStage = 1;
      if (
        currentStatus === "video_interview_done" ||
        currentStatus === "shortlisted" ||
        currentStatus === "direct_interview_in_progress" ||
        currentStatus === "direct_interview_done"
      ) {
        rejectionStage = 5;
      } else if (
        currentStatus === "physical_verification_done" ||
        currentStatus === "home_visit_done" ||
        currentStatus === "video_interview_in_progress"
      ) {
        rejectionStage = 4;
      } else if (
        currentStatus === "telephonic_done" ||
        currentStatus === "televerification_done" ||
        currentStatus === "physical_verification_in_progress"
      ) {
        rejectionStage = 3;
      } else if (
        currentStatus === "under_review" ||
        selectedApplicant.volunteer_suggestion ||
        (selectedApplicant.volunteer_name && selectedApplicant.volunteer_name !== "Admin Review")
      ) {
        rejectionStage = 2;
      } else {
        rejectionStage = 1;
      }

      const res = await adminApi.updateStatus(
        selectedApplicant.id,
        "rejected",
        defaultReason,
        selectedApplicant.email,
        selectedApplicant.full_name,
        rejectionStage
      );
      if (res.success) {
        const updatedApp = {
          ...selectedApplicant,
          status: "rejected",
          rejectionReason: defaultReason,
          rejectionStage,
        };

        setSelectedApplicant(updatedApp);
        setApplications((prev) =>
          prev.map((a) => (a.id === selectedApplicant.id ? updatedApp : a))
        );

        // Optimistically sync rejection reason and stage to local storage for instant student dashboard reflection
        if (typeof window !== "undefined") {
          const keysToSync = [
            selectedApplicant.email,
            selectedApplicant.mobile_number,
            selectedApplicant.user_id,
            selectedApplicant.id,
            selectedApplicant.application_number,
          ].filter(Boolean);

          keysToSync.forEach((k) => {
            window.localStorage.setItem(`maatram_application_rejection_reason_${k}`, defaultReason);
            window.localStorage.setItem(`maatram_application_rejection_stage_${k}`, String(rejectionStage));
            window.localStorage.setItem(`maatram_application_status_${k}`, "rejected");
          });
          window.localStorage.setItem("maatram_application_rejection_reason_latest", defaultReason);
          window.localStorage.setItem("maatram_application_rejection_stage_latest", String(rejectionStage));
          window.localStorage.setItem("maatram_application_status_latest", "rejected");
        }

        setStatusUpdateMessage(`Application ${selectedApplicant.application_number} has been rejected.`);
        setTimeout(() => setStatusUpdateMessage(""), 5000);
        setIsRejectModalOpen(false);
      } else {
        alert(res.message || "Failed to reject application");
      }
    } catch (err: any) {
      alert("Error rejecting application: " + (err.message || "Unknown error"));
    } finally {
      setIsRejecting(false);
    }
  };

  // Build all details rows for Excel/CSV export
  const buildFullApplicantRows = () => {
    return filteredApplications.map((a) => {
      // Format siblings summary
      const siblingsSummary = Array.isArray(a.siblings) && a.siblings.length > 0
        ? a.siblings.map((s: any) => `${s.name || ""}(${s.relationship || ""}, ${s.education || ""})`).join("; ")
        : "";

      // Format subjects if any
      const twelfthSubjectsSummary = Array.isArray(a.twelfth_subjects) && a.twelfth_subjects.length > 0
        ? a.twelfth_subjects.map((sub: any) => `${sub.name || ""}: ${sub.marks || 0}`).join("; ")
        : "";

      return {
        "Application Number": a.application_number || "",
        "Full Name": a.full_name || "",
        "Status": a.status || "",
        "Volunteer Suggestion": a.volunteer_suggestion || "",
        "Volunteer Name": a.volunteer_name || "",
        // A. Personal Information
        "Date of Birth": a.dob || "",
        "Gender": a.gender || "",
        "Blood Group": a.blood_group || "",
        "Mobile Number": a.mobile_number || "",
        "WhatsApp Number": a.whatsappNumber || a.alt_mobile_number || "",
        "Email ID": a.email || "",
        "Aadhaar Number": a.aadhaar_number || "",
        "Community": a.community || "",
        "Nationality": a.nationality || "Indian",

        // B. Family Information
        "Father Name": a.father_name || "",
        "Father Occupation": a.father_occupation || "",
        "Father Monthly Income": a.father_income || a.fatherMonthlyIncome || "",
        "Father Employment Status": a.fatherEmploymentStatus || "",
        "Mother Name": a.mother_name || "",
        "Mother Occupation": a.mother_occupation || "",
        "Mother Monthly Income": a.mother_income || a.motherMonthlyIncome || "",
        "Mother Employment Status": a.motherEmploymentStatus || "",
        "Total Annual Family Income": a.family_annual_income || a.annual_income || a.annualFamilyIncome || "",
        "Family Members Count": a.familyMembersCount || a.family_members_count || "",
        "Family Type": a.familyType || "Nuclear",
        "Family Situation": a.familySituation || (a.orphan ? "Orphan" : a.single_parent ? "Single Parent" : "Both Parents"),
        "Guardian Name": a.guardian_name || a.guardianName || "",
        "Guardian Occupation": a.guardian_occupation || a.guardianOccupation || "",
        "Guardian Monthly Income": a.guardian_income || a.guardianMonthlyIncome || "",
        "Guardian Relation": a.guardianRelation || "",

        // C. Siblings Information
        "Siblings Count": a.siblingCount || (Array.isArray(a.siblings) ? a.siblings.length : (a.siblings_count || 0)),
        "Siblings Currently Studying": a.siblingsStudyingCount || "",
        "Siblings Details": siblingsSummary,

        // D. Address Information
        "Permanent Address": a.permanentAddress || a.address || "",
        "Current Address": a.currentAddress || a.address || "",
        "Village / Town": a.villageTown || "",
        "District": a.district || "",
        "State": a.state || "Tamil Nadu",
        "Pincode": a.pincode || "",
        "Residence Type": a.residenceType || a.housing_status || "Own",
        "Monthly Rent": (a.residenceType || a.housing_status) === "Rented" ? a.rentAmount || a.rent_amount || "" : "",

        // E. Educational Information
        "10th School": a.tenth_school_name || a.tenthSchool || "",
        "10th Board": a.tenth_board || a.tenthBoard || "",
        "10th Pass Year": a.tenth_pass_year || a.tenthYear || "",
        "10th Percentage": a.tenth_percentage || a.tenthPercentage || "",
        "10th Marks Obtained": a.tenth_marks_obtained || a.tenthTotalMarks || "",
        "11th School": a.eleventh_school_name || a.eleventhSchool || "",
        "11th Board": a.eleventh_board || a.eleventhBoard || "",
        "11th Pass Year": a.eleventh_pass_year || a.eleventhYear || "",
        "11th Percentage": a.eleventh_percentage || a.eleventhPercentage || "",
        "12th School": a.twelfth_school_name || a.twelfthSchool || "",
        "12th Board": a.twelfth_board || a.twelfthBoard || "",
        "12th Group / Stream": a.twelfth_group || a.twelfth_stream || a.twelfthStream || "",
        "12th Pass Year": a.twelfth_pass_year || a.twelfthYear || "",
        "12th Cutoff": a.twelfth_cutoff || a.twelfthCutoff || "",
        "12th Total Marks": a.twelfth_total_marks || a.twelfthTotalMarks || "",
        "12th Max Marks": a.twelfth_max_marks || a.twelfthMaxMarks || "",
        "12th Percentage": a.twelfth_percentage || a.twelfthPercentage || "",
        "12th Subject Marks": twelfthSubjectsSummary,
        "First Generation Graduate": a.first_graduate ? "Yes" : "No",
        "Preferred Degree": a.preferred_degree || "",
        "Preferred Course (1st)": a.preferred_branch || (Array.isArray(a.preferred_courses) ? a.preferred_courses[0] : ""),
        "Preferred Course (2nd)": a.secondBranch || (Array.isArray(a.preferred_courses) ? a.preferred_courses[1] : ""),
        "Preferred College Location": a.preferredCollegeLocation || (Array.isArray(a.preferred_districts) ? a.preferred_districts.join(", ") : ""),

        // F. Financial Information
        "Monthly Family Income": a.monthlyFamilyIncome || a.father_income || "",
        "Income Sources": a.incomeSources || "",
        "Family Debts": a.familyDebts || "",
        "Existing Education Loans": a.educationLoans || "",
        "Financial Difficulties Faced": a.financialDifficulties || "",
        "Why Student Needs Financial Support": a.whyNeedSupport || "",
        "Ability to Afford College Without Support": a.affordabilityWithoutSupport || "",

        // G. Personal & Background Information
        "Orphan Status": a.orphan ? "Yes" : "No",
        "Single Parent Status": a.single_parent ? "Yes" : "No",
        "First Generation Learner": a.first_graduate ? "Yes" : "No",
        "Special Family Circumstances": a.specialCircumstances || "",
        "Career Ambition": a.careerAmbition || a.career_aspiration || "",
        "Why Wants Higher Education": a.higherEducationReason || "",
        "Willing to Relocate in TN": a.willingToRelocateTN ? "Yes" : "No",
        "Future Goals": a.futureGoals || "",
        "Hostel Required": a.hostel_required || a.need_hostel ? "Yes" : "No",
        "Submission Date": a.created_at ? new Date(a.created_at).toLocaleString() : "",
      };
    });
  };

  // Export to Excel (.xlsx) with ALL details and empty Volunteer Suggestion column
  const handleExportExcel = () => {
    if (filteredApplications.length === 0) {
      alert("No applicant data to export.");
      return;
    }

    try {
      const dataRows = buildFullApplicantRows();
      const worksheet = XLSX.utils.json_to_sheet(dataRows);

      // Auto-fit column widths for clear readability
      const colWidths = Object.keys(dataRows[0] || {}).map((key) => {
        const headerLen = key.length;
        const maxValLen = Math.max(
          ...dataRows.map((row: any) => String(row[key] || "").length),
          0
        );
        return { wch: Math.min(Math.max(headerLen, maxValLen) + 3, 40) };
      });
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Applicants");

      const todayStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Maatram_Students_Full_Details_${todayStr}.xlsx`);
    } catch (err: any) {
      alert("Failed to export Excel: " + err.message);
    }
  };

  // Export to CSV fallback
  const handleExportCSV = () => {
    if (filteredApplications.length === 0) {
      alert("No applicant data to export.");
      return;
    }

    const dataRows = buildFullApplicantRows();
    const headers = Object.keys(dataRows[0]);
    const csvLines = [
      headers.join(","),
      ...dataRows.map((row: any) =>
        headers
          .map((h) => {
            const val = String(row[h] || "").replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(",")
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Maatram_Students_Details_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save a volunteer suggestion directly from Dashboard
  const handleSaveVolunteerNote = async (applicantId: string) => {
    if (!volunteerNoteInput.trim() && volunteerNoteInput !== "") return;
    setIsSavingVolunteerNote(true);
    try {
      const res = await adminApi.updateVolunteerSuggestion(applicantId, volunteerNoteInput.trim());
      if (res.success) {
        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicantId ? { ...app, volunteer_suggestion: volunteerNoteInput.trim() } : app
          )
        );
        if (selectedApplicant && selectedApplicant.id === applicantId) {
          setSelectedApplicant((prev: any) => ({
            ...prev,
            volunteer_suggestion: volunteerNoteInput.trim(),
          }));
        }
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

  // Save physical verification report from Dashboard
  const handleSavePhysicalVolunteerNote = async (applicantId: string) => {
    setIsSavingVolunteerNote(true);
    try {
      const volName = selectedApplicant?.physical_volunteer_name || "Admin Review";
      const res = await adminApi.updateVolunteerSuggestion(
        applicantId,
        volunteerNoteInput.trim(),
        volName,
        {
          phase: "physical",
          student_description: volunteerStudentDescriptionInput.trim(),
          photos: adminPhysicalPhotos,
          front_view_home: adminPhysicalPhotos.front_view_home || "",
          inside_home: adminPhysicalPhotos.inside_home || "",
          furniture: adminPhysicalPhotos.furniture || "",
          with_student: adminPhysicalPhotos.with_student || "",
          backward: adminPhysicalPhotos.backward || "",
        }
      );
      if (res.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicantId
              ? {
                  ...app,
                  physical_volunteer_suggestion: volunteerNoteInput.trim(),
                  physical_student_description: volunteerStudentDescriptionInput.trim(),
                  physical_verification_photos: adminPhysicalPhotos,
                  front_view_home: adminPhysicalPhotos.front_view_home || "",
                  inside_home: adminPhysicalPhotos.inside_home || "",
                  furniture: adminPhysicalPhotos.furniture || "",
                  with_student: adminPhysicalPhotos.with_student || "",
                  backward: adminPhysicalPhotos.backward || "",
                }
              : app
          )
        );
        if (selectedApplicant && selectedApplicant.id === applicantId) {
          setSelectedApplicant((prev: any) => ({
            ...prev,
            physical_volunteer_suggestion: volunteerNoteInput.trim(),
            physical_student_description: volunteerStudentDescriptionInput.trim(),
            physical_verification_photos: adminPhysicalPhotos,
            front_view_home: adminPhysicalPhotos.front_view_home || "",
            inside_home: adminPhysicalPhotos.inside_home || "",
            furniture: adminPhysicalPhotos.furniture || "",
            with_student: adminPhysicalPhotos.with_student || "",
            backward: adminPhysicalPhotos.backward || "",
          }));
        }
        setEditingVolunteerId(null);
        setVolunteerNoteInput("");
        setVolunteerStudentDescriptionInput("");
        setStatusUpdateMessage("Physical verification findings saved successfully!");
        setTimeout(() => setStatusUpdateMessage(""), 5000);
      } else {
        alert(res.message || "Failed to save physical verification remarks");
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingVolunteerNote(false);
    }
  };

  // Sync volunteer suggestions by uploading filled Excel or CSV
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
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (!data || data.length === 0) {
          alert("Uploaded sheet is empty or could not be read.");
          setIsSyncing(false);
          return;
        }

        // Find suggestion and identifier columns
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
          alert("No volunteer suggestions found in the sheet. Please make sure the column header is 'Volunteer Suggestion' and has notes entered.");
          setIsSyncing(false);
          return;
        }

        setSyncStatusMsg(`Syncing ${suggestionsToSync.length} volunteer notes to database...`);
        const res = await adminApi.bulkUpdateVolunteerSuggestions(suggestionsToSync);

        if (res.success) {
          alert(`Successfully synced ${res.updatedCount || suggestionsToSync.length} volunteer suggestions into Admin Dashboard!`);
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

  // Sync directly from a published/public Google Sheet CSV URL
  const handleGoogleSheetUrlSync = async () => {
    if (!googleSheetUrl.trim()) {
      alert("Please enter a Google Sheet URL.");
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg("Fetching live data from Google Sheets...");

    try {
      // Convert standard Google Sheet URL to CSV export URL if needed
      let csvUrl = googleSheetUrl.trim();
      if (csvUrl.includes("docs.google.com/spreadsheets/d/")) {
        const match = csvUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          const sheetId = match[1];
          csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        }
      }

      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error(
          "Could not fetch sheet. Please make sure the Google Sheet link sharing is set to 'Anyone with the link can view' (or File > Share > Publish to web)."
        );
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
        alert("Connected to Google Sheet, but no rows had a 'Volunteer Suggestion' entered yet.");
        setIsSyncing(false);
        return;
      }

      setSyncStatusMsg(`Syncing ${suggestionsToSync.length} notes from Google Sheet...`);
      const res = await adminApi.bulkUpdateVolunteerSuggestions(suggestionsToSync);

      if (res.success) {
        alert(`Success! Synced ${res.updatedCount || suggestionsToSync.length} volunteer suggestions from Google Sheet into dashboard.`);
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

  // Print Application
  const handlePrint = () => {
    window.print();
  };

  // Sign out
  const handleAdminLogout = () => {
    adminApi.logout();
    router.push("/");
  };

  // Status Badge Helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Submitted
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <ClockIcon className="w-3.5 h-3.5 text-slate-500" />
            Draft
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300">
            <ClockIcon className="w-3.5 h-3.5 text-amber-600" />
            Phase 1: Televerification
          </span>
        );
      case "telephonic_done":
      case "televerification_done":
      case "physical_verification_in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ClockIcon className="w-3.5 h-3.5 text-indigo-600" />
            Phase 2: Physical Verification
          </span>
        );
      case "physical_verification_done":
      case "home_visit_done":
      case "video_interview_in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200">
            <ClockIcon className="w-3.5 h-3.5 text-sky-600" />
            Phase 3: Video Call Interview
          </span>
        );
      case "video_interview_done":
      case "shortlisted":
      case "direct_interview_in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
            <ClockIcon className="w-3.5 h-3.5 text-purple-600" />
            Phase 4: Direct Interview (Final)
          </span>
        );
      case "direct_interview_done":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-teal-50 text-teal-800 border border-teal-300">
            <CheckCircleIcon className="w-3.5 h-3.5 text-teal-600" />
            Phase 4 Cleared
          </span>
        );
      case "selected":
      case "scholarship_awarded":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
            Selected & Awarded
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XMarkIcon className="w-3.5 h-3.5 text-rose-500" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  // Calculate volunteer statistics
  const volunteerStats = useMemo(() => {
    let reviewed = 0;
    applications.forEach((a) => {
      if (a.volunteer_suggestion && String(a.volunteer_suggestion).trim() !== "") {
        reviewed++;
      }
    });
    return {
      reviewed,
      pending: Math.max(applications.length - reviewed, 0),
    };
  }, [applications]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-primary flex">
      {/* 1. Dedicated Admin Sidebar Component */}
      <AdminSidebar
        activeTab="applications"
        onTabChange={(tab) => {
          setActiveTab(tab);
          handleCloseApplicant();
        }}
        applicationsCount={applications.length}
        reviewedCount={volunteerStats.reviewed}
        pendingCount={volunteerStats.pending}
        onSignOutClick={() => setIsSignOutModalOpen(true)}
      />

      {/* 2. Main Body Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {/* Main Content Area */}
        <main className="w-full px-6 lg:px-10 py-8 space-y-6 flex-1">
          {isRestoringApplicant && !selectedApplicant ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-sm font-semibold text-slate-500">Loading application...</div>
            </div>
          ) : selectedApplicant ? (
            /* ================= FULL PAGE APPLICATION DOCUMENT VIEW ================= */
            <div className="w-full space-y-6 animate-in fade-in duration-200">
              {/* Status Update Banner */}
              {statusUpdateMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between animate-in fade-in">
                  <div className="flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{statusUpdateMessage}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusUpdateMessage("")}
                    className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Official Trust Application Sheet */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-7">
                {/* Trust Letterhead Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-slate-900 gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={handleCloseApplicant}
                      className="p-2 -ml-2 text-slate-400 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
                      title="Back to Applicants List"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <Image
                      src="/assets/images/logo.png"
                      alt="Maatram Foundation"
                      width={160}
                      height={80}
                      priority
                      className="h-12 w-auto object-contain"
                    />
                    <div>
                      <h3 className="font-heading font-black text-base sm:text-lg text-slate-900 uppercase tracking-wider">
                        Maatram Educational & Charitable Trust
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">
                        Higher Education 100% Free Sponsorship Program (Academic Year 2025 - 2026)
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Zero Donation • Zero Tuition Fee • Free Higher Education
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2.5">
                    {selectedApplicant.status === "rejected" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold rounded-xl shadow-2xs">
                        <XCircleIcon className="w-4 h-4 text-rose-600" />
                        <span>Application Rejected</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs"
                      title="Print official application form"
                    >
                      <PrinterIcon className="w-4 h-4 text-slate-500" />
                      <span>Print Form</span>
                    </button>
                  </div>
                </div>

                {/* 4-PHASE SELECTION & VERIFICATION PIPELINE */}
                {(() => {
                  // Rule: Once admin rejects the application, NO verification box, NO suggestion, NO reassign volunteer option.
                  // Only student details alone show.
                  if (selectedApplicant.status === "rejected") {
                    return null;
                  }

                  const isFinalSelected =
                    selectedApplicant.status === "selected" ||
                    selectedApplicant.status === "scholarship_awarded";

                  if (isFinalSelected) {
                    return (
                      <div className="p-5 rounded-2xl border bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-emerald-300 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                              <CheckBadgeIcon className="w-6 h-6 stroke-[2]" />
                            </div>
                            <div>
                              <h4 className="font-heading font-black text-sm text-emerald-950 uppercase tracking-wider">
                                Final Selection & 100% Free Higher Education Scholarship Awarded
                              </h4>
                              <p className="text-xs text-emerald-800/90 mt-0.5">
                                Candidate has successfully cleared all 4 verification phases: Televerification, Physical Verification, Video Call Interview, and Direct Interview.
                              </p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold rounded-xl shadow-2xs">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                            Admission Letter Granted
                          </span>
                        </div>
                      </div>
                    );
                  }

                  const currentAction = getNextPhaseAction(selectedApplicant.status);

                  // ================= PHASE 2: PHYSICAL VERIFICATION =================
                  if (
                    selectedApplicant.status === "telephonic_done" ||
                    selectedApplicant.status === "televerification_done" ||
                    selectedApplicant.status === "physical_verification_in_progress"
                  ) {
                    const hasPhysicalVolunteer = Boolean(
                      selectedApplicant.physical_volunteer_name &&
                      selectedApplicant.physical_volunteer_name.trim() !== ""
                    );
                    const hasPhysicalSuggestion = Boolean(
                      (selectedApplicant.physical_volunteer_suggestion &&
                        selectedApplicant.physical_volunteer_suggestion.trim() !== "") ||
                      (selectedApplicant.physical_student_description &&
                        selectedApplicant.physical_student_description.trim() !== "")
                    );

                    const physicalPhotos: Record<string, string> =
                      selectedApplicant.physical_verification_photos || {
                        front_view_home: selectedApplicant.front_view_home || "",
                        inside_home: selectedApplicant.inside_home || "",
                        furniture: selectedApplicant.furniture || "",
                        with_student: selectedApplicant.with_student || "",
                        backward: selectedApplicant.backward || "",
                      };

                    return (
                      <div className="p-6 rounded-3xl border bg-linear-to-r from-blue-50/70 via-indigo-50/40 to-white border-blue-200 shadow-sm space-y-5">
                        {/* Header Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-200/70">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <HomeModernIcon className="w-5 h-5 text-indigo-600" />
                                <span>Second Phase: Physical Verification</span>
                              </h4>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 border border-blue-300 text-blue-900 text-xs font-bold rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                {hasPhysicalVolunteer
                                  ? hasPhysicalSuggestion
                                    ? "Report Submitted"
                                    : "Phase 2 In Progress"
                                  : "Waiting for Volunteer Assignment"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              Phase 1 Televerification completed. Field / in-person verification of applicant residence, economic status, and living conditions.
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {hasPhysicalVolunteer ? (
                              <button
                                type="button"
                                onClick={() => openVolunteerAssignment("physical")}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 text-indigo-900 text-xs font-bold rounded-xl border border-indigo-200 shadow-2xs transition cursor-pointer"
                                title="Change or reassign physical verification volunteer"
                              >
                                <UserPlusIcon className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Reassign Physical Volunteer</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openVolunteerAssignment("physical")}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 text-xs font-heading font-bold uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer"
                              >
                                <UserPlusIcon className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                                <span>Assign Volunteer for Physical Verification</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* SECTION A: Phase 1 Televerification Report (Completed) */}
                        <div className="bg-white p-4.5 rounded-2xl border border-emerald-200 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Phase 1: Televerification Report (Completed)
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Verified by:{" "}
                              <strong className="text-slate-900 font-bold">
                                {selectedApplicant.tele_volunteer_name || selectedApplicant.volunteer_name || "Admin Review"}
                              </strong>
                              {selectedApplicant.tele_volunteer_role ? ` (${selectedApplicant.tele_volunteer_role})` : ""}
                            </span>
                          </div>

                          <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                            <p className="text-xs font-bold text-slate-900 leading-relaxed italic">
                              &quot;{selectedApplicant.tele_volunteer_suggestion || selectedApplicant.volunteer_suggestion || "Telephonic screening cleared. Recommended for physical verification."}&quot;
                            </p>
                          </div>

                          {(selectedApplicant.tele_volunteer_affiliation || selectedApplicant.tele_volunteer_email || selectedApplicant.tele_volunteer_phone) && (
                            <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                              {selectedApplicant.tele_volunteer_affiliation && (
                                <span>Affiliation: <strong className="text-slate-700">{selectedApplicant.tele_volunteer_affiliation}</strong></span>
                              )}
                              {selectedApplicant.tele_volunteer_email && (
                                <span>Email: <strong className="text-slate-700">{selectedApplicant.tele_volunteer_email}</strong></span>
                              )}
                              {selectedApplicant.tele_volunteer_phone && (
                                <span>Contact: <strong className="text-slate-700">{selectedApplicant.tele_volunteer_phone}</strong></span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* SECTION B: Phase 2 Physical Verification Status & Actions */}
                        {hasPhysicalVolunteer ? (
                          <div className="bg-white p-5 rounded-2xl border border-indigo-200 shadow-2xs space-y-5">
                            {/* Volunteer info strip */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl">
                                  <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                                  Assigned Physical Volunteer: {selectedApplicant.physical_volunteer_name}
                                </span>
                                {selectedApplicant.physical_volunteer_role && (
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    • {selectedApplicant.physical_volunteer_role} {selectedApplicant.physical_volunteer_affiliation ? `(${selectedApplicant.physical_volunteer_affiliation})` : ""}
                                  </span>
                                )}
                              </div>

                              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                                hasPhysicalSuggestion
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}>
                                {hasPhysicalSuggestion ? "✓ Physical Findings Submitted" : "Waiting for Volunteer Suggestion"}
                              </span>
                            </div>

                            {/* Editing / Recording mode */}
                            {editingVolunteerId === `physical_${selectedApplicant.id}` ? (
                              <div className="space-y-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-heading font-black text-xs text-indigo-950 uppercase tracking-wider">
                                    Record / Edit Physical Verification Report
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    Capture 5 home visit photos, student description & final suggestion
                                  </span>
                                </div>

                                {/* 1. Photos */}
                                <div>
                                  <label className="block text-xs font-bold text-slate-800 mb-2">
                                    1. Five Mandatory Home Visit Photos
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                    {PHYSICAL_PHOTO_SLOTS.map((slot, idx) => {
                                      const photoUrl = adminPhysicalPhotos[slot.key];
                                      return (
                                        <div
                                          key={slot.key}
                                          className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between"
                                        >
                                          <div className="flex items-center justify-between mb-1.5">
                                            <span className="font-heading font-bold text-[11px] text-slate-800 line-clamp-1">
                                              {idx + 1}. {slot.title}
                                            </span>
                                            {photoUrl ? (
                                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                                                ✓ Added
                                              </span>
                                            ) : (
                                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                                                Required
                                              </span>
                                            )}
                                          </div>

                                          {photoUrl ? (
                                            <div className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-900">
                                              <img
                                                src={photoUrl}
                                                alt={slot.title}
                                                className="w-full h-full object-cover"
                                              />
                                              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() => setPreviewImage({ url: photoUrl, title: slot.title })}
                                                  className="p-1.5 bg-white text-slate-900 rounded-lg shadow-xs hover:bg-slate-100 transition cursor-pointer"
                                                  title="View Full Size"
                                                >
                                                  <EyeIcon className="w-4 h-4" />
                                                </button>
                                                <label
                                                  className="p-1.5 bg-white text-slate-900 rounded-lg shadow-xs hover:bg-slate-100 transition cursor-pointer"
                                                  title="Replace Photo"
                                                >
                                                  <ArrowUpTrayIcon className="w-4 h-4" />
                                                  <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleAdminPhotoUpload(slot.key, e)}
                                                  />
                                                </label>
                                                <button
                                                  type="button"
                                                  onClick={() => handleAdminRemovePhoto(slot.key)}
                                                  className="p-1.5 bg-rose-600 text-white rounded-lg shadow-xs hover:bg-rose-700 transition cursor-pointer"
                                                  title="Delete Photo"
                                                >
                                                  <TrashIcon className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 rounded-lg aspect-[4/3] flex flex-col items-center justify-center gap-1 cursor-pointer transition p-2 text-center">
                                              <CameraIcon className="w-5 h-5 text-slate-400" />
                                              <span className="text-[10px] font-bold text-slate-600">Upload Photo</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleAdminPhotoUpload(slot.key, e)}
                                              />
                                            </label>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* 2. Student description */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-bold text-slate-800">
                                    2. Description about the Student
                                  </label>
                                  <textarea
                                    value={volunteerStudentDescriptionInput}
                                    onChange={(e) => setVolunteerStudentDescriptionInput(e.target.value)}
                                    placeholder="Enter description about student's family, living conditions, environment observed during home visit..."
                                    rows={3}
                                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                                  />
                                </div>

                                {/* 3. Final suggestion */}
                                <div className="space-y-1.5">
                                  <label className="block text-xs font-bold text-slate-800">
                                    3. Final Suggestion
                                  </label>
                                  <textarea
                                    value={volunteerNoteInput}
                                    onChange={(e) => setVolunteerNoteInput(e.target.value)}
                                    placeholder="Enter final recommendation (e.g. Recommended for scholarship due to genuine financial distress and verified academic drive)..."
                                    rows={2}
                                    className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
                                  />
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVolunteerId(null);
                                      setVolunteerNoteInput("");
                                      setVolunteerStudentDescriptionInput("");
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isSavingVolunteerNote}
                                    onClick={() => handleSavePhysicalVolunteerNote(selectedApplicant.id)}
                                    className="px-5 py-2 text-xs font-heading font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-xs"
                                  >
                                    {isSavingVolunteerNote ? "Saving..." : "Save Physical Report"}
                                  </button>
                                </div>
                              </div>
                            ) : !hasPhysicalSuggestion ? (
                              /* Case 1: Waiting for volunteer report */
                              <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <span className="text-xs font-heading font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4 text-amber-600 animate-spin" />
                                    Physical Verification Status: Waiting for Volunteer Suggestion
                                  </span>
                                  <span className="text-[11px] text-slate-600">
                                    Assigned Volunteer: <strong className="text-slate-900 font-bold">{selectedApplicant.physical_volunteer_name}</strong>
                                  </span>
                                </div>

                                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                  Waiting for volunteer suggestion. Assigned volunteer <strong>{selectedApplicant.physical_volunteer_name}</strong> is conducting in-person/home verification. Once the 5 pictures, student description, and final suggestion are submitted, the decision options to Move to Next Phase or Reject will appear here.
                                </p>

                                <div className="pt-3 border-t border-amber-200/70 flex flex-wrap items-center justify-end gap-2.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVolunteerId(`physical_${selectedApplicant.id}`);
                                      setVolunteerNoteInput(selectedApplicant.physical_volunteer_suggestion || "");
                                      setVolunteerStudentDescriptionInput(selectedApplicant.physical_student_description || selectedApplicant.student_description || "");
                                      setAdminPhysicalPhotos(physicalPhotos);
                                    }}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-heading font-bold shadow-2xs transition cursor-pointer"
                                  >
                                    <PencilSquareIcon className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Record Suggestion</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => openVolunteerAssignment("physical")}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-heading font-bold shadow-2xs transition cursor-pointer"
                                  >
                                    <UserPlusIcon className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Reassign Volunteer</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-xl text-xs font-heading font-bold shadow-2xs transition cursor-pointer"
                                  >
                                    <XCircleIcon className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* Case 2: Volunteer Report Submitted */
                              <div className="space-y-4">
                                {/* 1. Photos Gallery */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-heading font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                                      <PhotoIcon className="w-4 h-4 text-indigo-600" />
                                      Five Mandatory Home Visit Photos
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      Click any photo to view full size
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                                    {PHYSICAL_PHOTO_SLOTS.map((slot, idx) => {
                                      const photoUrl = physicalPhotos[slot.key];
                                      return (
                                        <div
                                          key={slot.key}
                                          className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col justify-between"
                                        >
                                          <div className="flex items-center justify-between mb-1.5">
                                            <span className="font-heading font-bold text-[10px] text-slate-800 line-clamp-1">
                                              {idx + 1}. {slot.title}
                                            </span>
                                            {photoUrl ? (
                                              <span className="px-1 py-0.5 bg-emerald-100 text-emerald-800 text-[8px] font-bold rounded">
                                                ✓ Added
                                              </span>
                                            ) : (
                                              <span className="px-1 py-0.5 bg-slate-200 text-slate-600 text-[8px] font-bold rounded">
                                                Pending
                                              </span>
                                            )}
                                          </div>

                                          {photoUrl ? (
                                            <button
                                              type="button"
                                              onClick={() => setPreviewImage({ url: photoUrl, title: slot.title })}
                                              className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-900 cursor-pointer block w-full text-left"
                                            >
                                              <img
                                                src={photoUrl}
                                                alt={slot.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                              />
                                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                                <span className="px-2 py-1 bg-white/90 text-slate-950 text-[10px] font-bold rounded-md shadow-xs flex items-center gap-1">
                                                  <EyeIcon className="w-3 h-3" /> View
                                                </span>
                                              </div>
                                            </button>
                                          ) : (
                                            <div className="rounded-lg border border-dashed border-slate-300 bg-white aspect-[4/3] flex flex-col items-center justify-center text-slate-400 gap-1">
                                              <CameraIcon className="w-5 h-5 text-slate-300" />
                                              <span className="text-[9px] font-medium">Not Captured</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* 2. Student Description */}
                                <div className="space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                  <span className="text-[10px] font-heading font-black uppercase tracking-wider text-slate-600 block">
                                    Description about the Student:
                                  </span>
                                  <p className="text-xs font-medium text-slate-800 leading-relaxed">
                                    {selectedApplicant.physical_student_description ||
                                      selectedApplicant.student_description ||
                                      "Student description recorded during field visit."}
                                  </p>
                                </div>

                                {/* 3. Final Suggestion */}
                                <div className="space-y-1 bg-indigo-50/70 p-4 rounded-xl border border-indigo-200/80">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-heading font-black uppercase tracking-wider text-indigo-950 block">
                                      Final Suggestion:
                                    </span>
                                    <span className="text-[10px] text-indigo-800 font-bold">
                                      — {selectedApplicant.physical_volunteer_name || "Volunteer"}
                                    </span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-900 leading-relaxed italic">
                                    &quot;{selectedApplicant.physical_volunteer_suggestion || "Recommended for next stage."}&quot;
                                  </p>
                                </div>

                                {/* Phase 2 Decision Bar */}
                                <div className="pt-3 border-t border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingVolunteerId(`physical_${selectedApplicant.id}`);
                                        setVolunteerNoteInput(selectedApplicant.physical_volunteer_suggestion || "");
                                        setVolunteerStudentDescriptionInput(selectedApplicant.physical_student_description || selectedApplicant.student_description || "");
                                        setAdminPhysicalPhotos(physicalPhotos);
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
                                    >
                                      <PencilSquareIcon className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Edit Report</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => openVolunteerAssignment("physical")}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold shadow-2xs transition cursor-pointer"
                                    >
                                      <UserPlusIcon className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Reassign Volunteer</span>
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
                                    <button
                                      type="button"
                                      disabled={isAdvancingPhase || selectedApplicant.status === "rejected"}
                                      onClick={handleMoveNextPhase}
                                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md active:scale-98 cursor-pointer"
                                      title="Approve physical verification and move to Phase 3 (Video Call Interview)"
                                    >
                                      {isAdvancingPhase ? (
                                        <>
                                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          <span>Advancing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <VideoCameraIcon className="w-4 h-4 text-white stroke-[2.5]" />
                                          <span>Move to Phase 3 (Video Call Interview)</span>
                                          <ArrowRightIcon className="w-3.5 h-3.5" />
                                        </>
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setIsRejectModalOpen(true)}
                                      disabled={selectedApplicant.status === "rejected"}
                                      className="inline-flex items-center gap-2 px-4 py-2.5 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border bg-white hover:bg-rose-50 text-rose-600 border-rose-300 hover:border-rose-400 shadow-xs active:scale-98 cursor-pointer"
                                      title="Reject application based on physical verification"
                                    >
                                      <XCircleIcon className="w-4 h-4 text-rose-500" />
                                      <span>Reject</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* No physical volunteer assigned yet */
                          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <span className="text-xs font-bold text-amber-900 block mb-0.5">
                                Action Required: Assign Volunteer for Physical Verification
                              </span>
                              <p className="text-xs text-slate-600">
                                Select a verified volunteer located near <strong>{selectedApplicant.district || "student residence"}</strong> to conduct physical field / home verification.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => openVolunteerAssignment("physical")}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition cursor-pointer"
                              >
                                <UserPlusIcon className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                                <span>Assign Volunteer</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsRejectModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-xl font-heading font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                              >
                                <XCircleIcon className="w-4 h-4 text-rose-500" />
                                <span>Reject</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // ================= PHASE 3 OR PHASE 4 BANNER =================
                  if (
                    selectedApplicant.status === "physical_verification_done" ||
                    selectedApplicant.status === "home_visit_done" ||
                    selectedApplicant.status === "video_interview_in_progress" ||
                    selectedApplicant.status === "video_interview_done" ||
                    selectedApplicant.status === "shortlisted" ||
                    selectedApplicant.status === "direct_interview_in_progress" ||
                    selectedApplicant.status === "direct_interview_done"
                  ) {
                    let phaseTitle = "Third Phase: Video Call Interview";
                    let phaseDesc = "Phase 2 Physical Verification cleared. Virtual advisory committee interaction in progress.";
                    let phaseBadge = "Phase 3 Active";

                    if (
                      selectedApplicant.status === "video_interview_done" ||
                      selectedApplicant.status === "shortlisted" ||
                      selectedApplicant.status === "direct_interview_in_progress" ||
                      selectedApplicant.status === "direct_interview_done"
                    ) {
                      phaseTitle = "Fourth Phase: Direct Interview (Final Stage)";
                      phaseDesc = "Phase 3 Video Call cleared. Direct in-person panel interview with senior trustees at Maatram Central Office.";
                      phaseBadge = "Phase 4 (Final Stage) Active";
                    }

                    return (
                      <div className="p-5 rounded-2xl border bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border-blue-300 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                                {phaseTitle}
                              </h4>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-100 border border-blue-300 text-blue-900 text-xs font-bold rounded-lg">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                                {phaseBadge}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{phaseDesc}</p>
                          </div>
                        </div>

                        {/* Verification History / Remarks */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {selectedApplicant.tele_volunteer_suggestion && (
                            <div className="bg-white p-3.5 rounded-xl border border-blue-200/80">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                                Phase 1 Televerification ({selectedApplicant.tele_volunteer_name || selectedApplicant.volunteer_name || "Volunteer"}):
                              </span>
                              <p className="text-xs font-bold text-slate-800 italic">
                                &quot;{selectedApplicant.tele_volunteer_suggestion || selectedApplicant.volunteer_suggestion}&quot;
                              </p>
                            </div>
                          )}
                          {selectedApplicant.physical_volunteer_suggestion && (
                            <div className="bg-white p-3.5 rounded-xl border border-indigo-200/80">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
                                Phase 2 Physical Verification ({selectedApplicant.physical_volunteer_name || "Volunteer"}):
                              </span>
                              <p className="text-xs font-bold text-slate-800 italic">
                                &quot;{selectedApplicant.physical_volunteer_suggestion}&quot;
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Decision Bar */}
                        <div className="pt-2 border-t border-blue-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <span className="text-xs text-slate-600 font-medium">
                            Admin decision for {phaseTitle}:
                          </span>
                          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
                            {currentAction && (
                              <button
                                type="button"
                                disabled={isAdvancingPhase}
                                onClick={handleMoveNextPhase}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md active:scale-98 cursor-pointer"
                              >
                                {isAdvancingPhase ? (
                                  <>
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Advancing...</span>
                                  </>
                                ) : (
                                  <>
                                    <currentAction.icon className="w-4 h-4 text-white stroke-[2.5]" />
                                    <span>{currentAction.buttonText}</span>
                                    <ArrowRightIcon className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setIsRejectModalOpen(true)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 hover:border-rose-400 font-heading font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs active:scale-98 cursor-pointer"
                            >
                              <XCircleIcon className="w-4 h-4 text-rose-500" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const isVolunteerAssigned = Boolean(
                    selectedApplicant.volunteer_name &&
                    selectedApplicant.volunteer_name.trim() !== "" &&
                    selectedApplicant.volunteer_name !== "Admin Review"
                  );
                  const hasVolunteerFeedback = Boolean(
                    selectedApplicant.volunteer_suggestion &&
                    selectedApplicant.volunteer_suggestion.trim() !== "" &&
                    !selectedApplicant.volunteer_suggestion.startsWith("Application rejected")
                  );

                  // 1. Fresh Application (Starting state): No volunteer assigned yet.
                  if (!isVolunteerAssigned && !hasVolunteerFeedback) {
                    return null;
                  }

                  // Phase 1: Volunteer Assigned, waiting for suggestion:
                  if (!hasVolunteerFeedback) {
                    return (
                      <div className="p-5 rounded-2xl border bg-linear-to-r from-amber-50/70 to-orange-50/60 border-amber-300 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                                  First Phase: Volunteer Televerification
                                </h4>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg">
                                  <UserIcon className="w-3.5 h-3.5 text-amber-700" />
                                  Assigned Volunteer: {selectedApplicant.volunteer_name}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5">
                                Telephonic verification in progress by assigned volunteer.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 text-[11px] font-bold rounded-lg border border-amber-300">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              Waiting for Volunteer Suggestion
                            </span>
                            <button
                              type="button"
                              onClick={() => openVolunteerAssignment("televerification")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-slate-900 text-xs font-bold rounded-xl border border-amber-300 shadow-2xs transition cursor-pointer"
                            >
                              <UserPlusIcon className="w-3.5 h-3.5 text-amber-600" />
                              <span>Reassign Volunteer</span>
                            </button>
                          </div>
                        </div>

                        <div className="mt-4">
                          {editingVolunteerId === selectedApplicant.id ? (
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-amber-200">
                              <label className="block text-xs font-bold text-slate-700">
                                Enter Volunteer Feedback / Suggestion:
                              </label>
                              <textarea
                                value={volunteerNoteInput}
                                onChange={(e) => setVolunteerNoteInput(e.target.value)}
                                placeholder="Enter volunteer suggestion (e.g., student verified via phone call, genuine financial need, mother is daily wage worker, strongly recommended for support)..."
                                rows={3}
                                className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F7BC0F] text-slate-900 font-medium"
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingVolunteerId(null);
                                    setVolunteerNoteInput("");
                                  }}
                                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isSavingVolunteerNote}
                                  onClick={() => handleSaveVolunteerNote(selectedApplicant.id)}
                                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-lg transition cursor-pointer shadow-xs"
                                >
                                  {isSavingVolunteerNote ? "Saving..." : "Save Suggestion"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white p-4 rounded-xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                                  Telephonic Verification Status:
                                </span>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                  Waiting for volunteer suggestion. Assigned volunteer{" "}
                                  <strong className="text-slate-900 font-bold">{selectedApplicant.volunteer_name}</strong>{" "}
                                  is conducting telephonic verification. Once the suggestion is submitted, the decision options to Move to Phase 2 (Physical Verification) or Reject will appear here.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVolunteerId(selectedApplicant.id);
                                  setVolunteerNoteInput(selectedApplicant.volunteer_suggestion || "");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-200 hover:border-amber-300 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition"
                                title="Enter volunteer feedback manually"
                              >
                                <PencilSquareIcon className="w-3.5 h-3.5 text-amber-600" />
                                <span>Record Suggestion</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Phase 1: Volunteer Suggestion Submitted
                  return (
                    <div className="p-5 rounded-2xl border bg-linear-to-r from-emerald-50/80 via-amber-50/60 to-white border-emerald-300 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                                First Phase: Volunteer Verification & Remarks
                              </h4>
                              {selectedApplicant.volunteer_name && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-lg">
                                  <UserIcon className="w-3.5 h-3.5" />
                                  Verified by: {selectedApplicant.volunteer_name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Telephonic verification feedback submitted by assigned volunteer.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg border border-emerald-300">
                            ✓ Phase 1 Feedback Recorded
                          </span>
                          <button
                            type="button"
                            onClick={() => openVolunteerAssignment("televerification")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100 text-slate-900 text-xs font-bold rounded-xl border border-amber-300 shadow-2xs transition cursor-pointer"
                          >
                            <UserPlusIcon className="w-3.5 h-3.5 text-amber-600" />
                            <span>Reassign Volunteer</span>
                          </button>
                        </div>
                      </div>

                      <div className="mt-4">
                        {editingVolunteerId === selectedApplicant.id ? (
                          <div className="space-y-3 bg-white p-4 rounded-xl border border-emerald-200">
                            <textarea
                              value={volunteerNoteInput}
                              onChange={(e) => setVolunteerNoteInput(e.target.value)}
                              placeholder="Enter volunteer feedback..."
                              rows={4}
                              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F7BC0F] text-slate-900 font-medium"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVolunteerId(null);
                                  setVolunteerNoteInput("");
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSavingVolunteerNote}
                                onClick={() => handleSaveVolunteerNote(selectedApplicant.id)}
                                className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-lg transition cursor-pointer shadow-xs"
                              >
                                {isSavingVolunteerNote ? "Saving..." : "Save Suggestion"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ================= VOLUNTEER SUGGESTION CARD WITH BOUND ACTIONS ================= */
                          <div className="bg-white p-4.5 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  Volunteer Suggestion / Feedback:
                                </span>
                                <div className="flex items-center gap-3">
                                  {selectedApplicant.volunteer_name && (
                                    <span className="text-[11px] text-slate-600 font-medium">
                                      Verified by Volunteer:{" "}
                                      <strong className="text-slate-900 font-bold">
                                        {selectedApplicant.volunteer_name}
                                      </strong>
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingVolunteerId(selectedApplicant.id);
                                      setVolunteerNoteInput(selectedApplicant.volunteer_suggestion || "");
                                    }}
                                    className="text-[11px] text-slate-500 hover:text-emerald-700 font-semibold cursor-pointer underline"
                                  >
                                    Edit
                                  </button>
                                </div>
                              </div>
                              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                                <p className="text-sm font-bold text-slate-900 leading-relaxed italic">
                                  &quot;{selectedApplicant.volunteer_suggestion}&quot;
                                </p>
                              </div>
                            </div>

                            {/* BOUND ACTIONS: Move to Phase 2 (Physical Verification) & Reject */}
                            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                              <span className="text-xs text-slate-500 font-medium">
                                Admin decision for Phase 1:
                              </span>
                              <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
                                <button
                                  type="button"
                                  disabled={isAdvancingPhase || selectedApplicant.status === "rejected"}
                                  onClick={handleMoveNextPhase}
                                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md active:scale-98 cursor-pointer"
                                  title="Approve televerification and advance applicant to Second Phase: Physical Verification"
                                >
                                  {isAdvancingPhase ? (
                                    <>
                                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Advancing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <HomeModernIcon className="w-4 h-4 text-white stroke-[2.5]" />
                                      <span>Move to Phase 2 (Physical Verification)</span>
                                      <ArrowRightIcon className="w-3.5 h-3.5" />
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setIsRejectModalOpen(true)}
                                  disabled={selectedApplicant.status === "rejected"}
                                  className="inline-flex items-center gap-2 px-4 py-2.5 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border bg-white hover:bg-rose-50 text-rose-600 border-rose-300 hover:border-rose-400 shadow-xs active:scale-98 cursor-pointer"
                                  title="Reject application based on televerification"
                                >
                                  <XCircleIcon className="w-4 h-4 text-rose-500" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Quick Jump Navigation Strip */}
                <div className="flex border border-slate-200 bg-slate-50/80 p-1.5 rounded-2xl gap-2 overflow-x-auto text-xs font-heading font-bold text-slate-700 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => document.getElementById("sec-personal")?.scrollIntoView({ behavior: "smooth" })}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    1. Personal
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById("sec-family")?.scrollIntoView({ behavior: "smooth" })}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    2. Family
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById("sec-siblings")?.scrollIntoView({ behavior: "smooth" })}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    3. Siblings
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById("sec-address")?.scrollIntoView({ behavior: "smooth" })}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    4. Address
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById("sec-academic")?.scrollIntoView({ behavior: "smooth" })}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    5. Educational
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById("sec-financial")?.scrollIntoView({ behavior: "smooth" })}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    6. Financial
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById("sec-background")?.scrollIntoView({ behavior: "smooth" })}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    7. Background & Goals
                  </button>
                  <button
                    type="button"
                    onClick={() => document.getElementById("sec-documents")?.scrollIntoView({ behavior: "smooth" })}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#F7BC0F]/20 hover:text-slate-950 transition cursor-pointer whitespace-nowrap"
                  >
                    8. Documents
                  </button>
                </div>

                {/* Single Scroll Sections Container */}
                <div className="space-y-8 text-xs text-slate-800">
                  {/* SECTION 1: PERSONAL DETAILS */}
                  <section id="sec-personal" className="scroll-mt-6 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Personal Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Student Full Name</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.full_name || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Date of Birth</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.dob || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Gender</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.gender || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Blood Group</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.blood_group || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Mobile Number</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.mobile_number || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">WhatsApp Number</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.whatsappNumber || selectedApplicant.alt_mobile_number || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Email Address</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5 truncate">{selectedApplicant.email || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Aadhaar Number</span>
                        <p className="font-mono font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.aadhaar_number || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Community / Category</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.community || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Nationality</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.nationality || "Indian"}</p>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 2: FAMILY DETAILS */}
                  <section id="sec-family" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Family Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Father's Name</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.father_name || "—"}</p>
                        <p className="text-slate-500 text-[11px] mt-1">Occupation: {selectedApplicant.father_occupation || "—"}</p>
                        <p className="text-slate-500 text-[11px]">Monthly Income: {selectedApplicant.father_income || selectedApplicant.fatherMonthlyIncome || "—"}</p>
                        <p className="text-slate-500 text-[11px]">Status: {selectedApplicant.fatherEmploymentStatus || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Mother's Name</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.mother_name || "—"}</p>
                        <p className="text-slate-500 text-[11px] mt-1">Occupation: {selectedApplicant.mother_occupation || "—"}</p>
                        <p className="text-slate-500 text-[11px]">Monthly Income: {selectedApplicant.mother_income || selectedApplicant.motherMonthlyIncome || "—"}</p>
                        <p className="text-slate-500 text-[11px]">Status: {selectedApplicant.motherEmploymentStatus || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Total Family Income & Members</span>
                        <p className="font-bold text-sm text-emerald-800 mt-0.5">{selectedApplicant.family_annual_income || selectedApplicant.annual_income || selectedApplicant.annualFamilyIncome || "—"}</p>
                        <p className="text-slate-500 text-[11px] mt-1">Family Members: {selectedApplicant.familyMembersCount || selectedApplicant.family_members_count || "—"}</p>
                        <p className="text-slate-500 text-[11px]">Family Type: {selectedApplicant.familyType || "Nuclear"}</p>
                        <p className="text-slate-500 text-[11px]">Situation: {selectedApplicant.familySituation || (selectedApplicant.orphan ? "Orphan" : selectedApplicant.single_parent ? "Single Parent" : "Both Parents")}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Guardian Details (If Applicable)</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.guardian_name || selectedApplicant.guardianName || "—"}</p>
                        <p className="text-slate-500 text-[11px] mt-1">Relation: {selectedApplicant.guardianRelation || "—"}</p>
                        <p className="text-slate-500 text-[11px]">Occupation: {selectedApplicant.guardian_occupation || selectedApplicant.guardianOccupation || "—"}</p>
                        <p className="text-slate-500 text-[11px]">Income: {selectedApplicant.guardian_income || selectedApplicant.guardianMonthlyIncome || "—"}</p>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 3: SIBLINGS DETAILS */}
                  <section id="sec-siblings" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Siblings Information
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-4 text-xs mb-3">
                      <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500">Number of Siblings: </span>
                        <strong className="text-slate-900">{selectedApplicant.siblingCount || (Array.isArray(selectedApplicant.siblings) ? selectedApplicant.siblings.length : 0)}</strong>
                      </div>
                      <div className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                        <span className="text-slate-500">Siblings Currently Studying: </span>
                        <strong className="text-slate-900">{selectedApplicant.siblingsStudyingCount || "—"}</strong>
                      </div>
                    </div>
                    {selectedApplicant.siblings && selectedApplicant.siblings.length > 0 ? (
                      <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="py-2.5 px-3">Name</th>
                            <th className="py-2.5 px-3">Relationship</th>
                            <th className="py-2.5 px-3">Age</th>
                            <th className="py-2.5 px-3">Education / Occupation</th>
                            <th className="py-2.5 px-3">School / Institution</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {selectedApplicant.siblings.map((s: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-bold text-slate-900">{s.name || "—"}</td>
                              <td className="py-2 px-3 text-slate-600">{s.relationship || "—"}</td>
                              <td className="py-2 px-3 text-slate-600">{s.age || "—"}</td>
                              <td className="py-2 px-3 text-slate-600">{s.education || s.occupation || "—"}</td>
                              <td className="py-2 px-3 text-slate-600">{s.institution || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-200">No siblings recorded</p>
                    )}
                  </section>

                  {/* SECTION 4: ADDRESS INFORMATION */}
                  <section id="sec-address" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Address & Residence Details
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Permanent Address</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.permanentAddress || selectedApplicant.address || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Current Residential Address</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.currentAddress || selectedApplicant.address || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Village / Town</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.villageTown || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">District & State</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.district || "—"}, {selectedApplicant.state || "Tamil Nadu"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">PIN Code</span>
                        <p className="font-mono font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.pincode || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Residence Type</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.residenceType || selectedApplicant.housing_status || "Own"}</p>
                      </div>
                      {(selectedApplicant.residenceType || selectedApplicant.housing_status) === "Rented" && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Monthly Rent</span>
                          <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.rentAmount || selectedApplicant.rent_amount || "—"}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SECTION 5: EDUCATIONAL INFORMATION */}
                  <section id="sec-academic" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Educational Information (10th, 12th & Preferences)
                      </h4>
                    </div>

                    {/* 12th Standard Section (Most critical) */}
                    <div className="p-5 bg-amber-50/60 border border-amber-300 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-heading font-black text-sm text-amber-950">
                          12th Higher Secondary Marks (HSC)
                        </span>
                        {(selectedApplicant.twelfth_cutoff || selectedApplicant.twelfthCutoff) && (
                          <span className="px-3 py-1 bg-[#F7BC0F] font-mono font-black text-sm text-slate-950 rounded-xl shadow-xs">
                            Cutoff: {selectedApplicant.twelfth_cutoff || selectedApplicant.twelfthCutoff} / 200
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-3">
                        <div>
                          <span className="text-slate-500 block">School Name:</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.twelfth_school_name || selectedApplicant.twelfthSchool || "—"}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Board & Passing Year:</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.twelfth_board || selectedApplicant.twelfthBoard || "State Board"} ({selectedApplicant.twelfth_pass_year || selectedApplicant.twelfthYear || "—"})</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Group / Stream:</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.twelfth_group || selectedApplicant.twelfthStream || "—"}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Total Marks & %:</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.twelfth_total_marks || selectedApplicant.twelfthTotalMarks || "—"} / {selectedApplicant.twelfth_max_marks || "600"} ({selectedApplicant.twelfth_percentage || selectedApplicant.twelfthPercentage || "—"}%)</p>
                        </div>
                      </div>
                    </div>

                    {/* 10th Standard Section */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                      <span className="font-heading font-bold text-sm text-slate-900">10th Secondary School Marks (SSLC)</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mt-3">
                        <div>
                          <span className="text-slate-500 block">School Name:</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.tenth_school_name || selectedApplicant.tenthSchool || "—"}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Board & Passing Year:</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.tenth_board || selectedApplicant.tenthBoard || "State Board"} ({selectedApplicant.tenth_pass_year || selectedApplicant.tenthYear || "—"})</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Total Marks:</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.tenth_marks_obtained || selectedApplicant.tenthTotalMarks || "—"} / {selectedApplicant.tenth_max_marks || "500"}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Percentage:</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.tenth_percentage || selectedApplicant.tenthPercentage || "—"}%</p>
                        </div>
                      </div>
                    </div>

                    {/* Course & Degree Preferences */}
                    <div className="p-5 bg-white border border-slate-200 rounded-2xl">
                      <span className="font-heading font-bold text-sm text-slate-900">Course & Degree Preferences</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-3">
                        <div>
                          <span className="text-slate-500 block">Preferred Degree:</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.preferred_degree || selectedApplicant.preferredDegree || "—"}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Preferred Course (1st):</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.preferred_branch || (Array.isArray(selectedApplicant.preferred_courses) ? selectedApplicant.preferred_courses[0] : "") || "—"}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Preferred Course (2nd):</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.secondBranch || (Array.isArray(selectedApplicant.preferred_courses) ? selectedApplicant.preferred_courses[1] : "") || "—"}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Preferred College / Location:</span>
                          <p className="font-bold text-slate-900">{selectedApplicant.preferredCollegeLocation || (Array.isArray(selectedApplicant.preferred_districts) ? selectedApplicant.preferred_districts.join(", ") : "") || "—"}</p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 6: FINANCIAL INFORMATION */}
                  <section id="sec-financial" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Financial Information & Needs
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Annual Family Income</span>
                        <p className="font-bold text-sm text-emerald-800 mt-0.5">{selectedApplicant.annualIncome || selectedApplicant.family_annual_income || selectedApplicant.annualFamilyIncome || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Monthly Family Income</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.monthlyFamilyIncome || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Income Sources</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.incomeSources || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Family Debts</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.familyDebts || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Existing Education Loans</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.educationLoans || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Can Afford Without Support?</span>
                        <p className="font-bold text-sm text-slate-900 mt-0.5">{selectedApplicant.affordabilityWithoutSupport || "No"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 sm:col-span-3">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Financial Difficulties Faced by Family</span>
                        <p className="text-slate-800 mt-1 leading-relaxed">{selectedApplicant.financialDifficulties || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 sm:col-span-3">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Why the Student Needs Financial Support</span>
                        <p className="text-slate-800 mt-1 leading-relaxed">{selectedApplicant.whyNeedSupport || "—"}</p>
                      </div>
                    </div>
                  </section>

                  {/* SECTION 7: PERSONAL BACKGROUND & GOALS */}
                  <section id="sec-background" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Background, Career Ambition & Goals
                      </h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${selectedApplicant.orphan ? "bg-rose-100 border-rose-300 text-rose-950" : "bg-white border-slate-200 text-slate-500"}`}>
                        {selectedApplicant.orphan ? "✓ Orphan Student" : "Not Orphan"}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${selectedApplicant.single_parent ? "bg-purple-100 border-purple-300 text-purple-950" : "bg-white border-slate-200 text-slate-500"}`}>
                        {selectedApplicant.single_parent ? "✓ Single Parent Child" : "Both Parents"}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${selectedApplicant.first_graduate ? "bg-amber-100 border-amber-300 text-amber-950" : "bg-white border-slate-200 text-slate-500"}`}>
                        {selectedApplicant.first_graduate ? "✓ First-Generation Learner" : "Non-First Graduate"}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-emerald-50 border-emerald-300 text-emerald-950">
                        {selectedApplicant.willingToRelocateTN !== false ? "✓ Willing to Relocate in Tamil Nadu" : "Local Only"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 sm:col-span-2">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Career Ambition</span>
                        <p className="font-medium text-slate-800 mt-1">{selectedApplicant.careerAmbition || selectedApplicant.career_aspiration || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Why the Student Wants Higher Education</span>
                        <p className="font-medium text-slate-800 mt-1">{selectedApplicant.higherEducationReason || "—"}</p>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Future Goals</span>
                        <p className="font-medium text-slate-800 mt-1">{selectedApplicant.futureGoals || "—"}</p>
                      </div>
                      {selectedApplicant.specialCircumstances && (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 sm:col-span-2">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Special Family Circumstances</span>
                          <p className="font-medium text-slate-800 mt-1">{selectedApplicant.specialCircumstances}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* SECTION 8: DOCUMENTS CHECKLIST */}
                  <section id="sec-documents" className="scroll-mt-6 space-y-4 pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                      <h4 className="font-heading font-black text-sm text-slate-900 uppercase tracking-wider">
                        Document Uploads & Checklist
                      </h4>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-sm text-slate-900">Uploaded Documents</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                        {[
                          { label: "Student Photograph", url: selectedApplicant.studentPhoto },
                          { label: "10th Marksheet", url: selectedApplicant.document10thMarksheet || selectedApplicant.document_10th_marksheet },
                          { label: "12th Marksheet", url: selectedApplicant.document12thMarksheet || selectedApplicant.document_12th_marksheet },
                          { label: "Aadhaar Document", url: selectedApplicant.documentAadhaarCard || selectedApplicant.document_aadhaar_card },
                        ].map((doc, idx) => (
                          <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between gap-2 shadow-2xs">
                            <span className="font-semibold text-slate-800 text-xs">{doc.label}</span>
                            {doc.url ? (
                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                <span className="font-bold text-emerald-600 text-[11px] flex items-center gap-1">
                                  <CheckBadgeIcon className="w-3.5 h-3.5 text-emerald-500" /> Uploaded
                                </span>
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" /> View
                                </a>
                              </div>
                            ) : (
                              <div className="pt-1 border-t border-slate-100 text-slate-400 text-[11px] italic">
                                Not provided
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl text-xs text-amber-950">
                      <p className="font-bold">Applicant Declaration</p>
                      <p className="mt-1 text-slate-700">
                        "I hereby declare that all details furnished in this application are true and correct to the best of my knowledge and belief. I agree to abide by the rules of Maatram Foundation."
                      </p>
                    </div>
                  </section>

                  {/* End of Application Actions: Starting state vs Assigned vs Suggestion recorded */}
                  {(() => {
                    // 0. REJECTED STATE: Reject means reject done. No reassign volunteer, no suggestions.
                    if (selectedApplicant.status === "rejected") {
                      return (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-slate-200">
                          <div className="text-xs text-rose-700 font-semibold flex items-center gap-2">
                            <XCircleIcon className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>This application has been rejected by Admin. Notification email has been sent to the student.</span>
                          </div>
                          <div>
                            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-700 border border-rose-300 font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-2xs">
                              <XCircleIcon className="w-4 h-4 text-rose-600 stroke-[2.5]" />
                              <span>Application Rejected</span>
                            </span>
                          </div>
                        </div>
                      );
                    }

                    const isVolunteerAssigned = Boolean(
                      selectedApplicant.volunteer_name &&
                      selectedApplicant.volunteer_name.trim() !== "" &&
                      selectedApplicant.volunteer_name !== "Admin Review"
                    );
                    const hasVolunteerFeedback = Boolean(
                      selectedApplicant.volunteer_suggestion &&
                      selectedApplicant.volunteer_suggestion.trim() !== "" &&
                      !selectedApplicant.volunteer_suggestion.startsWith("Application rejected")
                    );

                    return (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t-2 border-slate-200">
                        <div className="text-xs text-slate-500">
                          {!isVolunteerAssigned && !hasVolunteerFeedback && (
                            <span className="font-semibold text-slate-700">
                              Applicant Review: Review the complete application details above and assign a volunteer for televerification or reject.
                            </span>
                          )}
                          {isVolunteerAssigned && !hasVolunteerFeedback && (
                            <span className="font-semibold text-amber-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              Waiting for volunteer suggestion from <strong className="text-slate-900">{selectedApplicant.volunteer_name}</strong>
                            </span>
                          )}
                          {hasVolunteerFeedback && (
                            <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              Volunteer suggestion recorded — choose next action below:
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto justify-end">
                          {/* 4-PHASE ACTIONS IN BOTTOM BAR */}
                          {(() => {
                            const isFinalSelected =
                              selectedApplicant.status === "selected" ||
                              selectedApplicant.status === "scholarship_awarded";

                            if (isFinalSelected) {
                              return (
                                <span className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-900 border border-emerald-300 font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-2xs">
                                  <CheckBadgeIcon className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                                  <span>100% Free Scholarship Awarded</span>
                                </span>
                              );
                            }

                            const currentAction = getNextPhaseAction(selectedApplicant.status);

                            // Active Phase 2 (Physical Verification):
                            if (
                              selectedApplicant.status === "telephonic_done" ||
                              selectedApplicant.status === "televerification_done" ||
                              selectedApplicant.status === "physical_verification_in_progress"
                            ) {
                              const hasPhysicalVol = Boolean(
                                selectedApplicant.physical_volunteer_name &&
                                selectedApplicant.physical_volunteer_name.trim() !== ""
                              );
                              const hasPhysicalSugg = Boolean(
                                (selectedApplicant.physical_volunteer_suggestion &&
                                  selectedApplicant.physical_volunteer_suggestion.trim() !== "") ||
                                (selectedApplicant.physical_student_description &&
                                  selectedApplicant.physical_student_description.trim() !== "")
                              );

                              if (!hasPhysicalVol) {
                                return (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => openVolunteerAssignment("physical")}
                                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md active:scale-98 cursor-pointer"
                                    >
                                      <UserPlusIcon className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                                      <span>Assign Volunteer for Physical Verification</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setIsRejectModalOpen(true)}
                                      className="inline-flex items-center gap-2 px-5 py-3 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border bg-white hover:bg-rose-50 text-rose-600 border-rose-300 hover:border-rose-400 shadow-xs active:scale-98 cursor-pointer"
                                    >
                                      <XCircleIcon className="w-4 h-4 text-rose-500" />
                                      <span>Reject</span>
                                    </button>
                                  </>
                                );
                              }

                              if (!hasPhysicalSugg) {
                                return (
                                  <>
                                    <span className="inline-flex items-center gap-1.5 px-4 py-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold">
                                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                      <span>Waiting for Physical Verification Report</span>
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => openVolunteerAssignment("physical")}
                                      className="inline-flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-300 transition cursor-pointer"
                                      title="Reassign physical verification volunteer"
                                    >
                                      <UserPlusIcon className="w-3.5 h-3.5 text-slate-600" />
                                      <span>Reassign Volunteer</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setIsRejectModalOpen(true)}
                                      className="inline-flex items-center gap-2 px-5 py-3 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border bg-white hover:bg-rose-50 text-rose-600 border-rose-300 hover:border-rose-400 shadow-xs active:scale-98 cursor-pointer"
                                    >
                                      <XCircleIcon className="w-4 h-4 text-rose-500" />
                                      <span>Reject</span>
                                    </button>
                                  </>
                                );
                              }

                              return (
                                <>
                                  {currentAction && (
                                    <button
                                      type="button"
                                      disabled={isAdvancingPhase}
                                      onClick={handleMoveNextPhase}
                                      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md active:scale-98 cursor-pointer"
                                      title={currentAction.buttonText}
                                    >
                                      {isAdvancingPhase ? (
                                        <>
                                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          <span>Advancing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <currentAction.icon className="w-4 h-4 text-white stroke-[2.5]" />
                                          <span>{currentAction.buttonText}</span>
                                          <ArrowRightIcon className="w-3.5 h-3.5 text-white/80" />
                                        </>
                                      )}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => openVolunteerAssignment("physical")}
                                    className="inline-flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-300 transition cursor-pointer"
                                    title="Reassign physical verification volunteer"
                                  >
                                    <UserPlusIcon className="w-3.5 h-3.5 text-slate-600" />
                                    <span>Reassign Volunteer</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-5 py-3 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border bg-white hover:bg-rose-50 text-rose-600 border-rose-300 hover:border-rose-400 shadow-xs active:scale-98 cursor-pointer"
                                  >
                                    <XCircleIcon className="w-4 h-4 text-rose-500" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              );
                            }

                            // Active Phase 3 or 4:
                            if (
                              selectedApplicant.status === "physical_verification_done" ||
                              selectedApplicant.status === "home_visit_done" ||
                              selectedApplicant.status === "video_interview_in_progress" ||
                              selectedApplicant.status === "video_interview_done" ||
                              selectedApplicant.status === "shortlisted" ||
                              selectedApplicant.status === "direct_interview_in_progress" ||
                              selectedApplicant.status === "direct_interview_done"
                            ) {
                              return (
                                <>
                                  {currentAction && (
                                    <button
                                      type="button"
                                      disabled={isAdvancingPhase}
                                      onClick={handleMoveNextPhase}
                                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md active:scale-98 cursor-pointer"
                                      title={currentAction.buttonText}
                                    >
                                      {isAdvancingPhase ? (
                                        <>
                                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          <span>Advancing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <currentAction.icon className="w-4 h-4 text-white stroke-[2.5]" />
                                          <span>{currentAction.buttonText}</span>
                                          <ArrowRightIcon className="w-3.5 h-3.5 text-white/80" />
                                        </>
                                      )}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-5 py-3 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border bg-white hover:bg-rose-50 text-rose-600 border-rose-300 hover:border-rose-400 shadow-xs active:scale-98 cursor-pointer"
                                  >
                                    <XCircleIcon className="w-4 h-4 text-rose-500" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              );
                            }

                            // Phase 1 Starting state: No volunteer assigned yet
                            if (!isVolunteerAssigned && !hasVolunteerFeedback) {
                              return (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openVolunteerAssignment("televerification")}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#F7BC0F] hover:bg-[#e5ad0c] text-slate-950 font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md active:scale-98 cursor-pointer"
                                  >
                                    <UserPlusIcon className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                                    <span>Assign Volunteer for Televerification</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-5 py-3 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border bg-white hover:bg-rose-50 text-rose-600 border-rose-300 hover:border-rose-400 shadow-xs active:scale-98 cursor-pointer"
                                  >
                                    <XCircleIcon className="w-4 h-4 text-rose-500" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              );
                            }

                            // Phase 1 Volunteer assigned, waiting for suggestion
                            if (isVolunteerAssigned && !hasVolunteerFeedback) {
                              return (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => openVolunteerAssignment("televerification")}
                                    className="inline-flex items-center gap-2 px-5 py-3 bg-amber-100 hover:bg-amber-200 text-amber-950 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border border-amber-300 shadow-2xs transition active:scale-98 cursor-pointer"
                                  >
                                    <UserPlusIcon className="w-4 h-4 text-amber-700 stroke-[2.5]" />
                                    <span>Reassign Volunteer</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setIsRejectModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-5 py-3 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border bg-white hover:bg-rose-50 text-rose-600 border-rose-300 hover:border-rose-400 shadow-xs active:scale-98 cursor-pointer"
                                  >
                                    <XCircleIcon className="w-4 h-4 text-rose-500" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              );
                            }

                            // Phase 1 Volunteer suggestion recorded
                            return (
                              <>
                                <button
                                  type="button"
                                  disabled={isAdvancingPhase}
                                  onClick={handleMoveNextPhase}
                                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md active:scale-98 cursor-pointer"
                                  title="Approve televerification and move to Phase 2 (Physical Verification)"
                                >
                                  {isAdvancingPhase ? (
                                    <>
                                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      <span>Advancing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <HomeModernIcon className="w-4 h-4 text-white stroke-[2.5]" />
                                      <span>Move to Phase 2 (Physical Verification)</span>
                                      <ArrowRightIcon className="w-3.5 h-3.5 text-white/80" />
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setIsRejectModalOpen(true)}
                                  className="inline-flex items-center gap-2 px-5 py-3 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border bg-white hover:bg-rose-50 text-rose-600 border-rose-300 hover:border-rose-400 shadow-xs active:scale-98 cursor-pointer"
                                >
                                  <XCircleIcon className="w-4 h-4 text-rose-500" />
                                  <span>Reject</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => openVolunteerAssignment("televerification")}
                                  className="inline-flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-heading font-bold text-xs uppercase tracking-wider rounded-xl border border-slate-300 transition cursor-pointer"
                                  title="Change assigned volunteer"
                                >
                                  <UserPlusIcon className="w-3.5 h-3.5 text-slate-600" />
                                  <span>Reassign</span>
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            /* ================= REGULAR TABLE LIST VIEW ================= */
            <>
              {/* Title & Banner with Export CSV */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
                    Applicants Details
                  </h1>
                  <p className="font-primary text-xs sm:text-sm text-slate-600 mt-1">
                    Review and manage student applications for the Maatram Foundation 2025-26 program.
                  </p>
                </div>

                {/* Single Export Excel Button */}
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-heading font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer shadow-sm border border-[#e5ad0c]"
                  title="Download complete student details as Excel (.xlsx) with Volunteer Suggestion column"
                >
                  <TableCellsIcon className="w-4 h-4 stroke-[2.2]" />
                  <span>Export Excel</span>
                </button>
              </div>

              {/* Error message */}
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-medium flex items-center justify-between">
                  <span>{errorMessage}</span>
                  <button
                    onClick={fetchApplications}
                    className="underline font-bold text-red-700 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Status update alert toast */}
              {statusUpdateMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                  <span>{statusUpdateMessage}</span>
                </div>
              )}

              {/* 2. Search, Filter & Controls Bar */}
              <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, application no, mobile, email, or district..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#F7BC0F] focus:bg-white focus:ring-2 focus:ring-[#F7BC0F]/20 transition"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">

                  {/* District Filter */}
                  {districtList.length > 0 && (
                    <select
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#F7BC0F] cursor-pointer"
                    >
                      <option value="all">All Districts</option>
                      {districtList.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </section>

              {/* 3. Applicants Table */}
              <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-heading font-black text-base sm:text-lg text-slate-900">
                      Applicant Records
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Showing {filteredApplications.length} of {applications.length} students
                    </p>
                  </div>

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      Clear Search
                    </button>
                  )}
                </div>

                {filteredApplications.length === 0 ? (
                  <div className="py-20 text-center text-slate-500 text-xs">
                    <DocumentTextIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700">No applicants found</p>
                    <p className="text-slate-400 mt-1">Try adjusting your search or filter options.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 font-heading font-bold text-slate-600 tracking-wider uppercase text-[10px]">
                          <th className="py-3 px-4">Application No</th>
                          <th className="py-3 px-4">Student Name</th>
                          <th className="py-3 px-4">Contact Info</th>
                          <th className="py-3 px-4">District</th>
                          <th className="py-3 px-4">12th Cutoff</th>
                          <th className="py-3 px-4">Course Preference</th>
                          <th className="py-3 px-4">Family Income</th>
                          <th className="py-3 px-4">Volunteer Suggestion</th>
                          <th className="py-3 px-4 text-center">Siblings</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredApplications.map((app) => (
                          <tr
                            key={app.id}
                            className="hover:bg-amber-50/30 transition duration-150 cursor-pointer"
                            onClick={() => handleSelectApplicant(app)}
                          >
                            {/* Application Number */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                              {app.application_number || "MF-2025-001"}
                              <p className="text-[10px] text-slate-400 font-primary">
                                {app.created_at ? new Date(app.created_at).toLocaleDateString() : ""}
                              </p>
                            </td>

                            {/* Student Name */}
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-slate-900 font-heading text-sm">
                                {app.full_name || "Untitled Applicant"}
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {app.gender || "Gender not specified"} • {app.first_graduate ? "First Graduate" : "Non-FG"}
                              </p>
                            </td>

                            {/* Contact Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-semibold">{app.mobile_number || "—"}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 mt-0.5 text-[11px]">
                                <EnvelopeIcon className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate max-w-[160px]">{app.email || "—"}</span>
                              </div>
                            </td>

                            {/* District */}
                            <td className="py-3.5 px-4">
                              <p className="font-semibold text-slate-800">{app.district || "—"}</p>
                              <p className="text-[10px] text-slate-500">{app.pincode || ""}</p>
                            </td>

                            {/* 12th Cutoff */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {app.twelfth_cutoff ? (
                                <div className="inline-block px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md font-mono font-bold text-amber-900 text-xs">
                                  {app.twelfth_cutoff}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                              <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                                {app.twelfth_group || ""}
                              </p>
                            </td>

                            {/* Course Preference */}
                            <td className="py-3.5 px-4">
                              {app.preferred_degree || (Array.isArray(app.preferred_courses) && app.preferred_courses.length > 0) || app.preferred_branch ? (
                                <div>
                                  <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                                    <AcademicCapIcon className="w-3.5 h-3.5 text-[#F7BC0F] shrink-0" />
                                    <span>{app.preferred_degree || (Array.isArray(app.preferred_courses) ? app.preferred_courses[0] : app.preferred_branch)}</span>
                                  </span>
                                  {(app.preferred_branch || (Array.isArray(app.preferred_courses) && app.preferred_courses[0] && app.preferred_courses[0] !== app.preferred_degree)) && (
                                    <p className="text-[10px] text-slate-500 truncate max-w-[140px]">
                                      {app.preferred_branch || app.preferred_courses[0]}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Family Income */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {app.family_annual_income || app.annual_income ? (
                                <span className="inline-block px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md font-mono font-bold text-emerald-800 text-[11px]">
                                  {app.family_annual_income || app.annual_income}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            {/* Volunteer Suggestion Column */}
                            <td
                              className="py-3.5 px-4 max-w-[220px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {editingVolunteerId === app.id ? (
                                <div className="flex flex-col gap-1.5">
                                  <textarea
                                    value={volunteerNoteInput}
                                    onChange={(e) => setVolunteerNoteInput(e.target.value)}
                                    placeholder="Type volunteer feedback..."
                                    rows={2}
                                    className="w-full text-xs p-2 bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-900"
                                  />
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingVolunteerId(null);
                                        setVolunteerNoteInput("");
                                      }}
                                      className="px-2 py-0.5 text-[10px] text-slate-500 hover:text-slate-700"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isSavingVolunteerNote}
                                      onClick={() => handleSaveVolunteerNote(app.id)}
                                      className="px-2.5 py-0.5 text-[10px] font-bold bg-[#F7BC0F] text-slate-950 rounded hover:bg-[#e5ad0c]"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              ) : (app.physical_volunteer_suggestion || app.volunteer_suggestion) ? (
                                <div className="group/note flex items-start justify-between gap-1">
                                  <div className="p-2 bg-amber-50/80 border border-amber-200/90 rounded-lg text-slate-800 text-[11px] leading-snug w-full">
                                    <p className="line-clamp-3">{app.physical_volunteer_suggestion || app.volunteer_suggestion}</p>
                                    {(app.physical_volunteer_name || app.volunteer_name) && (
                                      <p className="text-[9px] text-amber-800 font-bold mt-1">
                                        — {app.physical_volunteer_name || app.volunteer_name} {app.physical_volunteer_suggestion ? "(Physical)" : ""}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400">No remarks</span>
                              )}
                            </td>

                            {/* Siblings Count */}
                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              {(() => {
                                const count = Array.isArray(app.siblings)
                                  ? app.siblings.length
                                  : typeof app.siblings_count === "number"
                                    ? app.siblings_count
                                    : (app.family_members_count ? parseInt(app.family_members_count, 10) : 0);
                                return count > 0 ? (
                                  <span className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    <UserGroupIcon className="w-3 h-3 text-slate-500" />
                                    {count} {count === 1 ? "Sibling" : "Siblings"}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono text-xs">0</span>
                                );
                              })()}
                            </td>

                            {/* Actions */}
                            <td
                              className="py-3.5 px-4 text-right whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSelectApplicant(app)}
                                  className="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                  title="View full application"
                                >
                                  <EyeIcon className="w-4 h-4" />
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
            </>
          )}
        </main>
      </div>

      {/* Admin Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        onConfirm={handleAdminLogout}
        title="Admin Sign Out"
        description="Are you sure you want to sign out of the Maatram Admin Portal?"
      />

      {/* Sync Volunteer Notes Modal (Google Sheets live sync & Excel upload) */}
      {isSyncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <ArrowUpTrayIcon className="w-5 h-5 stroke-[2.2]" />
                </span>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900">
                    Sync Volunteer Suggestions
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pull volunteer verification feedback into the Admin Dashboard
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSyncModalOpen(false);
                  setSyncStatusMsg("");
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Method 1: Google Sheets Live Link Sync */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <span className="font-heading font-bold text-xs text-slate-900 uppercase tracking-wide">
                  Option A: Live Sync via Google Sheets Link
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If you uploaded the exported Excel to Google Sheets and shared the link with volunteers, paste the Google Sheet URL below to automatically pull all volunteer comments:
              </p>
              <div className="space-y-2">
                <input
                  type="url"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/your-sheet-id/edit"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F7BC0F] text-slate-900 font-medium"
                />
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={handleGoogleSheetUrlSync}
                  className="w-full py-2 px-3 text-xs font-bold text-slate-950 bg-[#F7BC0F] hover:bg-[#e5ad0c] rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSyncing ? "Syncing with Google Sheets..." : "Sync from Google Sheet Link"}
                </button>
              </div>
            </div>

            {/* Method 2: Upload Returned Excel File */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold text-xs flex items-center justify-center">2</span>
                <span className="font-heading font-bold text-xs text-slate-900 uppercase tracking-wide">
                  Option B: Upload Volunteer Excel / CSV File
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                If volunteers edited the Excel/CSV file locally and sent it back via WhatsApp, select the file to import their suggestions:
              </p>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-[#F7BC0F] bg-white rounded-xl cursor-pointer transition">
                <TableCellsIcon className="w-7 h-7 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-800">Choose Filled Excel / CSV File</span>
                <span className="text-[10px] text-slate-400">.xlsx, .xls, or .csv</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUploadSync}
                  className="hidden"
                />
              </label>
            </div>

            {syncStatusMsg && (
              <p className="text-xs text-center font-bold text-amber-700 animate-pulse">
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
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ASSIGN VOLUNTEER FOR TELEVERIFICATION MODAL ================= */}
      {isAssignVolunteerModalOpen && selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-linear-to-r from-amber-500/10 via-amber-50/50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F7BC0F]/20 border border-[#F7BC0F] flex items-center justify-center text-slate-900">
                  <UserPlusIcon className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 tracking-wide uppercase">
                    {assignVolunteerPhase === "physical"
                      ? "Assign Volunteer for Physical Verification (Phase 2)"
                      : "Assign Volunteer for Televerification (Phase 1)"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {assignVolunteerPhase === "physical"
                      ? "Allocate this application to an active volunteer for in-person / home verification."
                      : "Allocate this application to an active volunteer for telephonic screening and review."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAssignVolunteerModalOpen(false);
                  setSelectedVolunteerId(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              {/* Applicant Context Strip */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 block">
                    Target Applicant
                  </span>
                  <span className="font-heading font-black text-sm text-slate-900">
                    {selectedApplicant.full_name}
                  </span>
                  <span className="font-mono text-xs text-slate-500 ml-2">
                    ({selectedApplicant.application_number || "MF-2025-APP"})
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs flex-wrap">
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700">
                    Cutoff: <span className="text-amber-600 font-extrabold">{selectedApplicant.twelfth_cutoff || "N/A"}</span>
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700">
                    Target: <span className="font-bold">{selectedApplicant.preferred_degree || "Engineering"}</span>
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700">
                    District: <span className="font-bold">{selectedApplicant.district || "Tamil Nadu"}</span>
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700">
                    Mobile: <span className="font-bold">{selectedApplicant.mobile_number || "N/A"}</span>
                  </span>
                </div>
              </div>

              {/* Volunteer Directory & Selection */}
              <div className="space-y-3">
                <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
                  {/* Search Input */}
                  <div className="relative min-w-0 flex-1">
                    <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={volunteerSearchQuery}
                      onChange={(e) => setVolunteerSearchQuery(e.target.value)}
                      placeholder="Search by name, company, college..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F7BC0F] font-medium"
                    />
                  </div>

                  {/* Near the filter: Event Dropdown + Role Filter Tabs */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Event Dropdown */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <span className="flex items-center gap-1 px-2 text-xs font-bold text-slate-700 shrink-0">
                        <CalendarDaysIcon className="w-4 h-4 text-amber-600" />
                        <span className="hidden sm:inline">Event:</span>
                      </span>
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="text-xs font-semibold bg-white text-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#F7BC0F] max-w-[230px] truncate cursor-pointer shadow-2xs"
                      >
                        {phaseEvents.length > 0 ? (
                          phaseEvents.map((ev) => {
                            const regCount = (
                              (ev.accepted_students?.length || ev.acceptedStudents?.length || 0) +
                              (ev.accepted_alumni?.length || ev.acceptedAlumni?.length || 0) +
                              (ev.accepted_volunteers?.length || ev.acceptedVolunteers?.length || 0)
                            );
                            return (
                              <option key={ev.id} value={String(ev.id)}>
                                {ev.title || ev.name} ({ev.location || ev.mode || "Offline"} · {regCount} vol)
                              </option>
                            );
                          })
                        ) : (
                          <option value="" disabled>
                            No events available
                          </option>
                        )}
                      </select>
                    </div>

                    {/* Role Filter Tabs */}
                    <div className="inline-flex shrink-0 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                      <button
                        type="button"
                        onClick={() => setVolunteerRoleFilter("all")}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          volunteerRoleFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900"
                        }`}
                      >
                        All Volunteers
                      </button>
                      <button
                        type="button"
                        onClick={() => setVolunteerRoleFilter("alumni")}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          volunteerRoleFilter === "alumni" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900"
                        }`}
                      >
                        Alumni Volunteers
                      </button>
                      <button
                        type="button"
                        onClick={() => setVolunteerRoleFilter("student")}
                        className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                          volunteerRoleFilter === "student" ? "bg-white text-slate-900 shadow-2xs" : "hover:text-slate-900"
                        }`}
                      >
                        Student Volunteers
                      </button>
                    </div>
                  </div>
                </div>

                {/* Event Context Strip */}
                {selectedEventId && (
                  <div className="flex items-center justify-between px-3.5 py-1.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs">
                    <div className="flex items-center gap-1.5 text-amber-900 truncate mr-2">
                      <span className="font-bold shrink-0">Selected Event:</span>
                      <span className="font-medium text-amber-800 truncate">
                        {eventsList.find((ev) => String(ev.id) === String(selectedEventId))?.title ||
                          eventsList.find((ev) => String(ev.id) === String(selectedEventId))?.name ||
                          "Selected Event"}
                      </span>
                    </div>
                    <span className="text-amber-700 font-bold bg-white px-2 py-0.5 rounded-md border border-amber-200 shrink-0 text-[11px]">
                      {filteredVolunteers.length} volunteer{filteredVolunteers.length === 1 ? "" : "s"} enrolled
                    </span>
                  </div>
                )}

                {/* Volunteer Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                  {isLoadingVolunteers ? (
                    <div className="col-span-2 py-12 text-center text-xs font-bold text-slate-400">
                      Loading volunteer roster...
                    </div>
                  ) : filteredVolunteers.length === 0 ? (
                    <div className="col-span-2 py-8 px-4 text-center text-xs font-medium text-slate-500 bg-amber-50/40 rounded-xl border border-dashed border-amber-200 space-y-2">
                      <p className="font-bold text-slate-700">
                        No volunteers registered for this event yet.
                      </p>
                      <p className="text-slate-500 text-[11px] max-w-md mx-auto">
                        Only volunteers who registered / accepted this verification event in their portal appear here.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedEventId("general_pool")}
                        className="inline-block mt-1 px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-lg text-amber-900 font-bold text-xs transition cursor-pointer shadow-2xs"
                      >
                        Show All Volunteers (General Pool)
                      </button>
                    </div>
                  ) : (
                    filteredVolunteers.map((vol) => {
                      const isSelected = String(selectedVolunteerId) === String(vol.id);
                      const isAlumni = vol.role?.toLowerCase() === "alumni";

                      return (
                        <div
                          key={vol.id}
                          onClick={() => setSelectedVolunteerId(String(vol.id))}
                          className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between gap-3 ${
                            isSelected
                              ? "bg-amber-50/70 border-amber-500 shadow-xs ring-2 ring-amber-400/30"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-heading font-black text-xs ${
                                  isAlumni
                                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {vol.name?.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-heading font-bold text-xs text-slate-900">
                                    {vol.name}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                      isAlumni
                                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    }`}
                                  >
                                    {isAlumni ? "Alumni" : "Student"}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                  {isAlumni
                                    ? `${vol.designation || "Alumni"} • ${vol.company || "Maatram Alumni"}`
                                    : `${vol.department || "Scholar"} • ${vol.college || "Anna University"}`}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition shrink-0 ${
                                isSelected
                                  ? "border-amber-500 bg-amber-500 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <span className="block w-2 h-2 rounded-full bg-white" />}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            <span className="flex items-center gap-1">
                              <PhoneIcon className="w-3 h-3 text-slate-400" />
                              {vol.phone || "Phone verified"}
                            </span>
                            <span className="text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                              {vol.assigned_count || 0} Assigned
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
              <div className="text-xs">
                {selectedVolunteerId ? (
                  <span className="text-slate-700">
                    Ready to assign to:{" "}
                    <span className="font-bold text-slate-900">
                      {
                        (volunteersList.length > 0 ? volunteersList : DEFAULT_VOLUNTEERS).find(
                          (v) => String(v.id) === String(selectedVolunteerId)
                        )?.name
                      }
                    </span>
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Select a volunteer from the list above</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignVolunteerModalOpen(false);
                    setSelectedVolunteerId(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedVolunteerId || isAssigningVolunteer}
                  onClick={handleAssignVolunteer}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-linear-to-r from-amber-400 to-[#F7BC0F] hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md cursor-pointer"
                >
                  {isAssigningVolunteer ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Assigning...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      <span>Confirm Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= REJECT APPLICATION CONFIRMATION MODAL ================= */}
      {isRejectModalOpen && selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600">
                  <XCircleIcon className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-base text-slate-900 tracking-wide uppercase">
                    Reject Application
                  </h3>
                  <p className="text-xs text-rose-600 font-semibold">
                    Action will close this application in the pipeline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectionReason("");
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm text-slate-700 leading-relaxed">
                Are you sure you want to reject the application for{" "}
                <strong className="text-slate-900 font-bold">{selectedApplicant.full_name}</strong>{" "}
                <span className="font-mono text-slate-500">({selectedApplicant.application_number || "MF-2025-APP"})</span>?
              </p>
              <p className="text-xs text-rose-600 mt-2 font-semibold">
                This will update the selection pipeline status to REJECTED.
              </p>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={handleConfirmReject}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider rounded-xl shadow-xs transition hover:shadow-md cursor-pointer"
              >
                {isRejecting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Rejecting...</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="w-4 h-4 text-white stroke-[2.5]" />
                    <span>Reject</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Physical Verification Photo Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <span className="font-heading font-bold text-sm text-slate-800">
                {previewImage.title}
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
