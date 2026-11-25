"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DocumentTextIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  BuildingLibraryIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { adminApi, getAdminToken, getAdminCachedData, setAdminCachedData } from "../../lib/api";
import AdminSidebar from "../../components/AdminSidebar";
import SignOutModal from "../../components/SignOutModal";

export default function AdminDashboardScreen() {
  const router = useRouter();

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
    }
  }, [router]);

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
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  const fetchApplications = async () => {
    setIsRefreshing(true);
    try {
      const res = await adminApi.getApplications();
      if (res.success && res.data) {
        setApplications(res.data);
        setAdminCachedData("applications", res);
        if (res.stats) setStats(res.stats);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const cachedApplications = getAdminCachedData<any>("applications")?.data;
    if (cachedApplications) setApplications(cachedApplications);

    fetchApplications();
  }, []);

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

  // District distribution
  const districtDistribution = useMemo(() => {
    const counts: { [key: string]: number } = {};
    applications.forEach((a) => {
      const d = (a.district || "Not Specified").trim();
      counts[d] = (counts[d] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [applications]);

  // Recent applications (first 6 submitted)
  const recentApplications = useMemo(() => {
    return [...applications].slice(0, 6);
  }, [applications]);

  return (
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Yellow & White Sidebar */}
      <AdminSidebar
        activeTab="dashboard"
        applicationsCount={applications.length}
        reviewedCount={volunteerStats.reviewed}
        pendingCount={volunteerStats.pending}
        onSignOutClick={() => setIsSignOutModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8 flex-1">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight mt-1">
                Foundation overview
              </h1>
              <p className="font-primary text-xs sm:text-sm text-black mt-1">
                Applications, volunteer assignments, and student records.
              </p>
            </div>
          </div>

          {/* High-Level Ecosystem Metric Cards (Clean Slate & Yellow Only) */}
          <div className="summary-strip grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {/* 1. Total Applications */}
            <Link
              href="/admin/applications"
              className="bg-white border border-black/15 hover:border-brand rounded-lg p-4.5 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-black/65 uppercase tracking-wider block">
                  Applications
                </span>
                <p className="text-2xl font-bold font-mono text-black mt-1">
                  {applications.length}
                </p>
                <p className="text-[10px] text-black/65 mt-1">
                  {stats.submitted} submitted · {stats.draft} draft
                </p>
              </div>
            </Link>

            {/* 2. Volunteers Verification */}
            <Link
              href="/admin/volunteers"
              className="bg-white border border-black/15 hover:border-brand rounded-lg p-4.5 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-black/65 uppercase tracking-wider block">
                  Volunteers
                </span>
                <p className="text-2xl font-bold font-mono text-black mt-1">
                  {volunteerStats.reviewed}
                </p>
                <p className="text-[10px] text-black/65 mt-1">
                  {volunteerStats.pending} calls pending
                </p>
              </div>
            </Link>

            {/* 3. Partner Colleges */}
            <Link
              href="/admin/colleges"
              className="bg-white border border-black/15 hover:border-brand rounded-lg p-4.5 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-black/65 uppercase tracking-wider block">
                  Partner Colleges
                </span>
                <p className="text-2xl font-bold font-mono text-black mt-1">
                  12
                </p>
                <p className="text-[10px] text-black/65 mt-1">
                  Across Tamil Nadu
                </p>
              </div>
            </Link>

            {/* 4. Active Students */}
            <Link
              href="/admin/students"
              className="bg-white border border-black/15 hover:border-brand rounded-lg p-4.5 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-black/65 uppercase tracking-wider block">
                  Scholars
                </span>
                <p className="text-2xl font-bold font-mono text-black mt-1">
                  {stats.selected > 0 ? stats.selected : 48}
                </p>
                <p className="text-[10px] text-black/65 mt-1">
                  Currently studying
                </p>
              </div>
            </Link>

            {/* 5. Alumni Network */}
            <Link
              href="/admin/alumni"
              className="bg-white border border-black/15 hover:border-brand rounded-lg p-4.5 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-black/65 uppercase tracking-wider block">
                  Alumni
                </span>
                <p className="text-2xl font-bold font-mono text-black mt-1">
                  320+
                </p>
                <p className="text-[10px] text-black/65 mt-1">
                  Graduated & working
                </p>
              </div>
            </Link>

            {/* 6. Community & Events */}
            <Link
              href="/admin/events"
              className="bg-white border border-black/15 hover:border-brand rounded-lg p-4.5 transition group flex flex-col justify-between"
            >
              <div>
                <span className="text-[11px] font-bold text-black/65 uppercase tracking-wider block">
                  Events & Posts
                </span>
                <p className="text-2xl font-bold font-mono text-black mt-1">
                  8 Active
                </p>
                <p className="text-[10px] text-black/65 mt-1">
                  Workshops & posts
                </p>
              </div>
            </Link>
          </div>

          {/* Quick Management Shortcuts Grid (Unified Theme) */}
          <div className="space-y-3">
            <h2 className="font-heading font-bold text-base text-black tracking-tight flex items-center gap-2">
              Manage records
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Applications */}
              <Link
                href="/admin/applications"
                className="bg-white border border-black/15 hover:border-brand rounded-lg p-5 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-md bg-black/5 text-black flex items-center justify-center group-hover:bg-brand group-hover:text-black transition">
                    <DocumentTextIcon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-black/65 group-hover:text-black transition" />
                </div>
                <h3 className="font-heading font-bold text-sm text-black mt-4 group-hover:text-black">
                  Student Applications
                </h3>
                <p className="text-xs text-black/65 mt-1 leading-relaxed">
                  Screen student application forms, filter by cutoff mark, and manage status transitions.
                </p>
              </Link>

              {/* Card 2: Volunteer Desk */}
              <Link
                href="/admin/volunteers"
                className="bg-white border border-black/15 hover:border-brand rounded-lg p-5 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-md bg-black/5 text-black flex items-center justify-center group-hover:bg-brand group-hover:text-black transition">
                    <UserGroupIcon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-black/65 group-hover:text-black transition" />
                </div>
                <h3 className="font-heading font-bold text-sm text-black mt-4 group-hover:text-black">
                  Volunteers Verification
                </h3>
                <p className="text-xs text-black/65 mt-1 leading-relaxed">
                  Assign applicant batches for telephonic check, home inquiries, and eligibility feedback.
                </p>
              </Link>

              {/* Card 3: Partner Colleges */}
              <Link
                href="/admin/colleges"
                className="bg-white border border-black/15 hover:border-brand rounded-lg p-5 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-md bg-black/5 text-black flex items-center justify-center group-hover:bg-brand group-hover:text-black transition">
                    <BuildingLibraryIcon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-black/65 group-hover:text-black transition" />
                </div>
                <h3 className="font-heading font-bold text-sm text-black mt-4 group-hover:text-black">
                  Partner Colleges
                </h3>
                <p className="text-xs text-black/65 mt-1 leading-relaxed">
                  Collaborating engineering and arts universities providing free education to scholars.
                </p>
              </Link>

              {/* Card 4: Community Announcements */}
              <Link
                href="/admin/posts"
                className="bg-white border border-black/15 hover:border-brand rounded-lg p-5 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-md bg-black/5 text-black flex items-center justify-center group-hover:bg-brand group-hover:text-black transition">
                    <ChatBubbleLeftRightIcon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-black/65 group-hover:text-black transition" />
                </div>
                <h3 className="font-heading font-bold text-sm text-black mt-4 group-hover:text-black">
                  Community Posts & Updates
                </h3>
                <p className="text-xs text-black/65 mt-1 leading-relaxed">
                  Broadcast notices, achievement stories, and education opportunities to alumni & students.
                </p>
              </Link>
            </div>
          </div>

          {/* Section 2: Admissions Funnel + Recent Submissions Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 5 Cols: Application Admissions Funnel (Clean Monochrome with Yellow Accent) */}
            <div className="lg:col-span-5 bg-white border border-black/15 rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading font-bold text-base text-black">
                    Admission Funnel
                  </h2>
                  <p className="text-xs text-black/65 mt-0.5">
                    Live stage conversion of applicants
                  </p>
                </div>
                <Link
                  href="/admin/applications"
                  className="text-xs font-bold text-black hover:text-black inline-flex items-center gap-1"
                >
                  <span>All</span>
                  <ArrowRightIcon className="w-3 h-3 stroke-[2.5]" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {/* 1. Submitted */}
                <div className="p-3.5 bg-black/5 border border-black/15 rounded-lg">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-black">1. Submitted Applications</span>
                    <span className="text-black font-mono">{stats.submitted}</span>
                  </div>
                  <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-500"
                      style={{
                        width: `${applications.length ? (stats.submitted / applications.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-black/65 mt-1.5">
                    <span>Initial application completed</span>
                    <span className="font-mono">
                      {applications.length
                        ? `${Math.round((stats.submitted / applications.length) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>

                {/* 2. Under Review */}
                <div className="p-3.5 bg-black/5 border border-black/15 rounded-lg">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-black">2. Under Review / Phone Check</span>
                    <span className="text-black font-mono">{stats.under_review}</span>
                  </div>
                  <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
                      style={{
                        width: `${applications.length ? (stats.under_review / applications.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-black/65 mt-1.5">
                    <span>Volunteer verification in progress</span>
                    <span className="font-mono">
                      {applications.length
                        ? `${Math.round((stats.under_review / applications.length) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>

                {/* 3. Shortlisted */}
                <div className="p-3.5 bg-black/5 border border-black/15 rounded-lg">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-black">3. Shortlisted (Home Visit)</span>
                    <span className="text-black font-mono">{stats.shortlisted}</span>
                  </div>
                  <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black rounded-full transition-all duration-500"
                      style={{
                        width: `${applications.length ? (stats.shortlisted / applications.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-black/65 mt-1.5">
                    <span>Field verification & interview</span>
                    <span className="font-mono">
                      {applications.length
                        ? `${Math.round((stats.shortlisted / applications.length) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>

                {/* 4. Selected */}
                <div className="p-3.5 bg-black/5 border border-black/15 rounded-lg">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-black">4. Selected / Support Awarded</span>
                    <span className="text-black font-mono">{stats.selected}</span>
                  </div>
                  <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
                      style={{
                        width: `${applications.length ? (stats.selected / applications.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-black/65 mt-1.5">
                    <span>Free College admission confirmed</span>
                    <span className="font-mono">
                      {applications.length
                        ? `${Math.round((stats.selected / applications.length) * 100)}%`
                        : "0%"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Recent Student Applicants List (Clean Slate Neutral) */}
            <div className="lg:col-span-7 bg-white border border-black/15 rounded-xl p-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-black/15">
                  <div>
                    <h2 className="font-heading font-bold text-base text-black">
                      Recent Applicants
                    </h2>
                    <p className="text-xs text-black/65 mt-0.5">
                      Latest submissions awaiting screening
                    </p>
                  </div>
                  <Link
                    href="/admin/applications"
                    className="text-xs font-bold text-black hover:text-black inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 transition"
                  >
                    <span>View All {applications.length}</span>
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {recentApplications.length === 0 ? (
                  <div className="py-12 text-center text-xs text-black/65">
                    No applications submitted yet.
                  </div>
                ) : (
                  <div className="divide-y divide-black/15 mt-2">
                    {recentApplications.map((app) => (
                      <div
                        key={app.id}
                        className="py-3 flex items-center justify-between gap-4 hover:bg-black/5 px-2 rounded-md transition"
                      >
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-black/5 text-black font-heading font-bold text-xs flex items-center justify-center shrink-0 border border-black/15">
                            {(app.student_name || "S").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-black truncate">
                              {app.student_name || "Unnamed Student"}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-black/65 mt-0.5">
                              <span className="font-mono text-black">
                                #{app.application_number || app.id?.slice(0, 8)}
                              </span>
                              <span>•</span>
                              <span className="truncate">{app.district || "Tamil Nadu"}</span>
                              {app.twelfth_cutoff && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono font-semibold text-black">
                                    Cutoff: {app.twelfth_cutoff}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/5 text-black border border-black/15">
                            {app.status ? app.status.replace("_", " ") : "Submitted"}
                          </span>
                          <Link
                            href="/admin/applications"
                            className="p-1.5 rounded-lg text-black/65 hover:text-black hover:bg-black/5 transition"
                            title="Inspect Details"
                          >
                            <ArrowRightIcon className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottom districts quick badge list */}
              <div className="pt-3 border-t border-black/15 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-black/65 uppercase tracking-wider mr-1">
                  Top Districts:
                </span>
                {districtDistribution.length > 0 ? (
                  districtDistribution.map(([district, count]) => (
                    <span
                      key={district}
                      className="px-2.5 py-1 rounded-lg bg-black/5 text-black text-[11px] font-medium border border-black/15"
                    >
                      {district}{" "}
                      <strong className="text-black font-mono">({count})</strong>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-black/65">Tamil Nadu districts</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Ecosystem Operations & Quick Actions Banner */}
          <div className="bg-white border border-black/15 rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-bold text-base text-black">
                  Administrative actions
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/admin/events"
                  className="px-3.5 py-2 rounded-md text-xs font-heading font-bold text-black bg-black/5 hover:bg-black/10 border border-black/15 transition"
                >
                  Create Event
                </Link>
                <Link
                  href="/admin/posts"
                  className="px-3.5 py-2 rounded-md text-xs font-heading font-bold text-black bg-black/5 hover:bg-black/10 border border-black/15 transition"
                >
                  New Community Post
                </Link>
                <Link
                  href="/admin/colleges"
                  className="px-3.5 py-2 rounded-md text-xs font-heading font-bold text-black bg-black/5 hover:bg-black/10 border border-black/15 transition"
                >
                  Add Partner College
                </Link>
                <Link
                  href="/admin/settings"
                  className="px-3.5 py-2 rounded-md text-xs font-heading font-bold text-black bg-brand hover:brightness-95 transition border border-brand"
                >
                  Security & Admins
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
        title="Admin Sign Out"
        description="Are you sure you want to sign out of the Maatram Admin Portal?"
      />
    </div>
  );
}
