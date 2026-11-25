"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BuildingLibraryIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getAdminToken } from "../../lib/api";
import AdminSidebar from "../../components/AdminSidebar";
import SignOutModal from "../../components/SignOutModal";
import CollegeCard, { CollegeCardData } from "../../components/CollegeCard";

export default function AdminCollegesScreen() {
  const router = useRouter();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Add College Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCollegeName, setNewCollegeName] = useState("");
  const [newCollegeImage, setNewCollegeImage] = useState("");
  const [newCollegeBg, setNewCollegeBg] = useState("#F7BC0F");

  // Colleges list state (only image and name)
  const [collegesList, setCollegesList] = useState<CollegeCardData[]>([
    {
      id: "1",
      name: "PSG College of Technology",
      logoBg: "#F7BC0F",
      logoText: "PSG TECH",
    },
    {
      id: "2",
      name: "Vellore Institute of Technology",
      logoBg: "#000000",
      logoText: "VIT VELLORE",
    },
    {
      id: "3",
      name: "Thiagarajar College of Engineering",
      logoBg: "#FFFFFF",
      logoText: "TCE MADURAI",
    },
    {
      id: "4",
      name: "Sri Krishna College of Engineering and Technology",
      logoBg: "#F7BC0F",
      logoText: "SKCET",
    },
    {
      id: "5",
      name: "SASTRA Deemed University",
      logoBg: "#000000",
      logoText: "SASTRA",
    },
    {
      id: "6",
      name: "Loyola-ICAM College of Engineering and Technology",
      logoBg: "#FFFFFF",
      logoText: "LICET CHENNAI",
    },
  ]);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
    }
  }, [router]);

  // Filter & Search
  const filteredColleges = useMemo(() => {
    return collegesList.filter((col) =>
      col.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [collegesList, searchTerm]);

  const handleAddCollege = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollegeName.trim()) return;

    const newEntry: CollegeCardData = {
      id: Date.now().toString(),
      name: newCollegeName.trim(),
      imageSrc: newCollegeImage.trim() || undefined,
      logoBg: newCollegeBg,
      logoText: newCollegeName.trim().slice(0, 4).toUpperCase(),
    };

    setCollegesList((prev) => [newEntry, ...prev]);
    setIsAddModalOpen(false);
    setNewCollegeName("");
    setNewCollegeImage("");
  };

  return (
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Yellow & White Sidebar */}
      <AdminSidebar
        activeTab="colleges"
        onSignOutClick={() => setIsSignOutModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8 flex-1">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                Partner Colleges
              </h1>
              <p className="font-primary text-xs sm:text-sm text-black mt-1">
                Colleges and educational institutions affiliated with Maatram Foundation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-xs font-heading font-bold text-black bg-brand hover:brightness-95 transition cursor-pointer border border-brand"
              >
                <PlusIcon className="w-4 h-4 stroke-[2.5]" />
                <span>Add College</span>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white border border-black/15 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <MagnifyingGlassIcon className="w-4 h-4 text-black/65 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search colleges by name..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-md border border-black/15 bg-black/5 text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:bg-white transition"
              />
            </div>
            <p className="text-xs font-semibold text-black/65">
              Total Colleges: <span className="text-black font-bold">{filteredColleges.length}</span>
            </p>
          </div>

          {/* Colleges Card Grid (4 cards per row) */}
          {filteredColleges.length === 0 ? (
            <div className="bg-white border border-black/15 rounded-xl p-12 text-center text-black/65">
              <BuildingLibraryIcon className="w-12 h-12 mx-auto mb-3 text-black/65 stroke-1" />
              <p className="text-base font-bold text-black">No Partner Colleges Found</p>
              <p className="text-xs text-black/65 mt-1 max-w-sm mx-auto">
                No colleges match your current search query. Click "Add College" to add one.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredColleges.map((college) => (
                <CollegeCard
                  key={college.id}
                  college={college}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ADD COLLEGE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl border border-black/15 shadow-sm max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-black/15">
              <h3 className="font-heading font-bold text-base text-black">Add Partner College</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-black/65 hover:text-black cursor-pointer font-bold text-sm"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCollege} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-bold text-black mb-1.5">
                  College Name <span className="text-black/65">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCollegeName}
                  onChange={(e) => setNewCollegeName(e.target.value)}
                  placeholder="e.g. Loyola-ICAM College of Engineering"
                  className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-black mb-1.5">
                  Image URL (Optional)
                </label>
                <input
                  type="url"
                  value={newCollegeImage}
                  onChange={(e) => setNewCollegeImage(e.target.value)}
                  placeholder="https://example.com/college-campus.jpg"
                  className="w-full px-3.5 py-2.5 rounded-md border border-black/15 bg-white text-xs text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-bold text-black mb-1.5">
                  Card Theme Color
                </label>
                <div className="flex items-center gap-3">
                  {["#FFFFFF", "#F7BC0F", "#000000"].map((color) => (
                    <button
                      key={color}
                      aria-label={color === "#FFFFFF" ? "White" : color === "#000000" ? "Black" : "Yellow"}
                      aria-pressed={newCollegeBg === color}
                      type="button"
                      onClick={() => setNewCollegeBg(color)}
                      className={`w-7 h-7 rounded-md transition cursor-pointer border-2 ${
                        newCollegeBg === color ? "border-black ring-2 ring-brand" : "border-black/30"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/15">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-heading font-bold text-black hover:bg-black/5 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-heading font-bold text-black bg-brand hover:brightness-95 rounded-md transition cursor-pointer border border-brand"
                >
                  Add College
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sign Out Modal */}
      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
      />
    </div>
  );
}
