"use client";

import ScholarProfile from "../../components/ScholarProfile";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CheckIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AcademicCapIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CheckBadgeIcon,
  EyeIcon,
  XMarkIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { getAdminToken, adminApi, getAdminCachedData, setAdminCachedData, subscribeToAdminCache } from "../../lib/api";
import AdminSidebar from "../../components/AdminSidebar";
import SignOutModal from "../../components/SignOutModal";

interface SubjectMark {
  id: string;
  code: string;
  name: string;
  credits: number;
  internal1: string;
  internal2: string;
  modelExam: string;
  attendance: string;
  semesterExam: string;
  gradePoint: number | null;
  status: "Cleared" | "Arrear" | "In Progress";
}

interface SemesterRecord {
  sem: number;
  gpa: number | null;
  creditsEarned: number;
  totalCredits: number;
  status: "Cleared" | "In Progress" | "Upcoming" | "Arrear";
  standingArrears: number;
  subjects: SubjectMark[];
}

interface StudentItem {
  id: string;
  email: string;
  full_name: string;
  roll_number: string;
  phone: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  district?: string;
  college?: string;
  degree?: string;
  year?: string;
  cgpa?: string;
  status?: string;
  current_stage?: string;
  academic_records?: SemesterRecord[];
  academic_updated_at?: string;
  metadata?: any;
}

export default function AdminStudentsScreen() {
  const router = useRouter();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [studentDetailsTab, setStudentDetailsTab] = useState<"profile" | "academics">("profile");

  // Admin Academic Edit State
  const [adminAcademicRecords, setAdminAcademicRecords] = useState<SemesterRecord[]>([]);
  const [selectedAdminSem, setSelectedAdminSem] = useState(1);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [subjectForm, setSubjectForm] = useState<Partial<SubjectMark>>({});
  const [isSavingAcademics, setIsSavingAcademics] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const cachedStudents = getAdminCachedData<StudentItem[]>("students");
    if (cachedStudents) setStudents(cachedStudents);

    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
    }
  }, [router]);

  const fetchStudents = async () => {
    try {
      const res = await adminApi.getStudents();
      if (res && res.success && Array.isArray(res.data)) {
        setStudents(res.data);
        setAdminCachedData("students", res.data);
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAdminCache("students", () => {
      const cached = getAdminCachedData<StudentItem[]>("students");
      if (cached) setStudents(cached);
    });
    fetchStudents();
    return unsubscribe;
  }, []);

  const openStudentModal = async (student: StudentItem, tab: "profile" | "academics" = "profile") => {
    setSelectedStudent(student);
    setStudentDetailsTab(tab);
    setIsEditingSubject(false);
    setSelectedAdminSem(1);

    if (student.academic_records && student.academic_records.length > 0) {
      setAdminAcademicRecords(student.academic_records);
    } else {
      try {
        const res = await adminApi.getStudentAcademics(student.email);
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setAdminAcademicRecords(res.data);
        } else {
          setAdminAcademicRecords([]);
        }
      } catch {
        setAdminAcademicRecords([]);
      }
    }
  };

  const handleSaveAcademicChanges = async () => {
    if (!selectedStudent?.email) return;
    setIsSavingAcademics(true);
    try {
      const res = await adminApi.saveStudentAcademics(selectedStudent.email, {
        records: adminAcademicRecords,
        cgpa: selectedStudent.cgpa,
      });
      if (res.success) {
        setToastMessage("Academic records updated successfully in database!");
        setTimeout(() => setToastMessage(""), 4000);
        fetchStudents();
      } else {
        alert("Failed to save academic records: " + (res.message || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error saving academic records: " + err.message);
    } finally {
      setIsSavingAcademics(false);
    }
  };

  const handleSubjectDelete = (subjectId: string) => {
    if (!confirm("Are you sure you want to remove this course mark?")) return;
    const updated = adminAcademicRecords.map((sem) => {
      if (sem.sem !== selectedAdminSem) return sem;
      return {
        ...sem,
        subjects: sem.subjects.filter((s) => s.id !== subjectId),
      };
    });
    setAdminAcademicRecords(updated);
  };

  const handleSaveSubjectForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectForm.code?.trim() || !subjectForm.name?.trim()) {
      alert("Subject Code and Course Name are required");
      return;
    }

    const updated = adminAcademicRecords.map((sem) => {
      if (sem.sem !== selectedAdminSem) return sem;
      const subjects = [...(sem.subjects || [])];
      const existingIdx = subjects.findIndex((s) => s.id === subjectForm.id);

      const record: SubjectMark = {
        id: subjectForm.id || `sub-${Date.now()}`,
        code: (subjectForm.code || "").trim().toUpperCase(),
        name: (subjectForm.name || "").trim(),
        credits: Number(subjectForm.credits) || 3,
        internal1: subjectForm.internal1 || "—",
        internal2: subjectForm.internal2 || "—",
        modelExam: subjectForm.modelExam || "—",
        attendance: subjectForm.attendance || "95%",
        semesterExam: subjectForm.semesterExam || "—",
        gradePoint: subjectForm.status === "Cleared" ? 8.5 : null,
        status: subjectForm.status || "In Progress",
      };

      if (existingIdx !== -1) {
        subjects[existingIdx] = record;
      } else {
        subjects.push(record);
      }

      return {
        ...sem,
        subjects,
      };
    });

    setAdminAcademicRecords(updated);
    setIsEditingSubject(false);
    setSubjectForm({});
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const q = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.roll_number?.toLowerCase().includes(q) ||
        s.college?.toLowerCase().includes(q) ||
        s.degree?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q)
    );
  }, [students, searchTerm]);

  return (
    <div className="min-h-screen bg-white text-black font-primary flex">
      {/* 1. Yellow & White Sidebar */}
      <AdminSidebar
        activeTab="students"
        onSignOutClick={() => setIsSignOutModalOpen(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <main className="w-full px-4 sm:px-6 lg:px-10 py-8 space-y-8 flex-1">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-black tracking-tight">
                Students Directory
              </h1>
              <p className="font-primary text-xs sm:text-sm text-black mt-1">
                Directory of currently supported students registered with authentication credentials.
              </p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-black/15 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-96">
              <MagnifyingGlassIcon className="w-4 h-4 text-black/65 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students by name, reg no, college or branch..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-md border border-black/15 bg-black/5 text-black placeholder:text-black/65 focus:outline-none focus:border-brand focus:bg-white transition"
              />
            </div>
          </div>

          {/* Student Table (Full width responsive layout without side-scrolling) */}
          <div className="bg-white border border-black/15 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-black/15 text-black/65 font-heading text-[11px] uppercase tracking-wider bg-black/5">
                  <th className="py-3.5 px-5 w-1/4">Scholar Student</th>
                  <th className="py-3.5 px-4 w-1/3">College & Degree</th>
                  <th className="py-3.5 px-4 w-1/6">Year & CGPA</th>
                  <th className="py-3.5 px-4 w-1/5">District & Email</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/15 font-medium">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-black/65">
                      <UserGroupIcon className="w-10 h-10 mx-auto mb-2 text-black/65 stroke-1" />
                      <p className="text-sm font-semibold text-black">No Students Found</p>
                      <p className="text-xs text-black/65 mt-1">
                        No students matched your search criteria.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-brand/15 transition">
                      {/* Student Name & Roll */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand/15 text-black font-bold flex items-center justify-center text-xs shrink-0">
                            {s.full_name?.charAt(0) || "S"}
                          </div>
                          <div>
                            <p className="font-semibold text-black">{s.full_name}</p>
                            <span className="font-mono text-[10px] text-black/65">{s.roll_number}</span>
                          </div>
                        </div>
                      </td>

                      {/* College & Degree */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-black">{s.college}</p>
                        <p className="text-[11px] text-black/65 mt-0.5">{s.degree}</p>
                      </td>

                      {/* Year & CGPA */}
                      <td className="py-3.5 px-4">
                        <p className="text-black font-medium">{s.year}</p>
                        <span className="inline-block text-[10px] font-bold text-black bg-brand/15 px-1.5 py-0.2 rounded mt-0.5">
                          CGPA: {s.cgpa}
                        </span>
                      </td>

                      {/* District & Email */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-black font-medium">
                          <MapPinIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                          {s.district}
                        </span>
                        <a
                          href={`mailto:${s.email}`}
                          className="text-black/65 hover:text-black flex items-center gap-1 font-mono text-[11px] mt-0.5"
                        >
                          <EnvelopeIcon className="w-3.5 h-3.5 text-black/65 shrink-0" />
                          <span className="truncate">{s.email}</span>
                        </a>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openStudentModal(s, "academics")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-black bg-black/5 hover:bg-brand cursor-pointer transition-colors"
                            title="Inspect & Edit Academic Marks"
                          >
                            <AcademicCapIcon className="w-3.5 h-3.5" />
                            <span>Academics</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Student Details & Academics Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 sm:p-7 shadow-sm space-y-5 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-black/15">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-lg bg-brand/15 text-black font-bold flex items-center justify-center text-base font-heading shrink-0">
                  {selectedStudent.full_name?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-lg text-black">
                      {selectedStudent.full_name}
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/5 text-black">
                      {selectedStudent.roll_number}
                    </span>
                  </div>
                  <p className="text-xs text-black/65 font-mono mt-0.5">{selectedStudent.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-md text-black/65 hover:text-black hover:bg-black/5 transition cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Segmented Tabs: Profile vs Academics */}
            <div className="flex items-center p-1 bg-black/5 rounded-lg border border-black/15">
              <button
                type="button"
                onClick={() => setStudentDetailsTab("academics")}
                className={`flex-1 py-2 text-center rounded-md font-heading font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  studentDetailsTab === "academics"
                    ? "bg-white text-black border border-black/15"
                    : "text-black hover:text-black"
                }`}
              >
                <AcademicCapIcon className="w-4 h-4 text-black" />
                <span>Academic Marks & Semesters</span>
              </button>
              <button
                type="button"
                onClick={() => setStudentDetailsTab("profile")}
                className={`flex-1 py-2 text-center rounded-md font-heading font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  studentDetailsTab === "profile"
                    ? "bg-white text-black border border-black/15"
                    : "text-black hover:text-black"
                }`}
              >
                <EyeIcon className="w-4 h-4 text-black" />
                <span>Scholar Profile & Schooling</span>
              </button>
            </div>

            {/* ================= TAB 1: ACADEMICS & MARKS (LIVE DATABASE EDITING) ================= */}
            {studentDetailsTab === "academics" ? (
              <div className="space-y-4 text-xs">
                {/* Semester Selector Pill Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((semNum) => {
                    const hasData = adminAcademicRecords.some(
                      (r) => r.sem === semNum && r.subjects && r.subjects.length > 0
                    );
                    const isSelected = selectedAdminSem === semNum;
                    return (
                      <button
                        key={semNum}
                        type="button"
                        onClick={() => {
                          setSelectedAdminSem(semNum);
                          setIsEditingSubject(false);
                        }}
                        className={`px-3 py-1.5 rounded-md font-heading font-bold text-xs whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? "bg-brand text-black border border-brand"
                            : hasData
                            ? "bg-brand/15 text-black border border-brand/60 hover:bg-brand/15"
                            : "bg-black/5 text-black border border-black/15 hover:bg-black/5"
                        }`}
                      >
                        <span>Semester {semNum}</span>
                        {hasData && <span className="text-[10px] font-bold"><CheckIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden="true" /></span>}
                      </button>
                    );
                  })}
                </div>

                {/* Semester Summary Header */}
                <div className="p-3 bg-brand/15 border border-brand/60 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="font-heading font-bold text-sm text-black">
                      Semester {selectedAdminSem} Course Marks
                    </span>
                    <span className="text-[11px] text-black/65 block">
                      {(adminAcademicRecords.find((r) => r.sem === selectedAdminSem)?.subjects || []).length} Subjects recorded • GPA: {adminAcademicRecords.find((r) => r.sem === selectedAdminSem)?.gpa || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSubjectForm({
                          id: `sub-${Date.now()}`,
                          code: "",
                          name: "",
                          credits: 4,
                          internal1: "",
                          internal2: "",
                          modelExam: "",
                          attendance: "95%",
                          semesterExam: "",
                          status: "In Progress",
                        });
                        setIsEditingSubject(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-heading font-bold text-xs text-black bg-white border border-black/15 hover:border-brand/60 hover:bg-black/5 cursor-pointer"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span>Add Course</span>
                    </button>
                  </div>
                </div>

                {/* Edit / Add Course Form (when triggered) */}
                {isEditingSubject && (
                  <form onSubmit={handleSaveSubjectForm} className="p-4 bg-black/5 border border-brand/60 rounded-lg space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-black/15">
                      <span className="font-heading font-bold text-xs text-black">
                        {subjectForm.id?.startsWith("sub-") ? "Add Course Marks" : "Edit Course Marks"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingSubject(false)}
                        className="text-black/65 hover:text-black text-xs font-bold"
                      >
                        <XMarkIcon className="inline-block h-[1em] w-[1em] align-[-0.125em]" aria-hidden={false} role="img" aria-label="Close" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-0.5">Subject Code</label>
                        <input
                          type="text"
                          required
                          value={subjectForm.code || ""}
                          onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                          placeholder="e.g. CS3351"
                          className="w-full p-2 bg-white border border-black/15 rounded-lg text-black font-mono uppercase"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-black mb-0.5">Course Name</label>
                        <input
                          type="text"
                          required
                          value={subjectForm.name || ""}
                          onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                          placeholder="e.g. Data Structures & Algorithms"
                          className="w-full p-2 bg-white border border-black/15 rounded-lg text-black"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-black mb-0.5">CAT 1 (/25)</label>
                        <input
                          type="text"
                          value={subjectForm.internal1 || ""}
                          onChange={(e) => setSubjectForm({ ...subjectForm, internal1: e.target.value })}
                          placeholder="23/25"
                          className="w-full p-2 bg-white border border-black/15 rounded-lg text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-black mb-0.5">CAT 2 (/25)</label>
                        <input
                          type="text"
                          value={subjectForm.internal2 || ""}
                          onChange={(e) => setSubjectForm({ ...subjectForm, internal2: e.target.value })}
                          placeholder="24/25"
                          className="w-full p-2 bg-white border border-black/15 rounded-lg text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-black mb-0.5">Model / CAT 3 (/50)</label>
                        <input
                          type="text"
                          value={subjectForm.modelExam || ""}
                          onChange={(e) => setSubjectForm({ ...subjectForm, modelExam: e.target.value })}
                          placeholder="46/50"
                          className="w-full p-2 bg-white border border-black/15 rounded-lg text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-black mb-0.5">End-Sem Grade</label>
                        <input
                          type="text"
                          value={subjectForm.semesterExam || ""}
                          onChange={(e) => setSubjectForm({ ...subjectForm, semesterExam: e.target.value })}
                          placeholder="O (94)"
                          className="w-full p-2 bg-white border border-black/15 rounded-lg text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-black mb-0.5">Status</label>
                        <select
                          value={subjectForm.status || "In Progress"}
                          onChange={(e) => setSubjectForm({ ...subjectForm, status: e.target.value as any })}
                          className="w-full p-2 bg-white border border-black/15 rounded-lg text-black font-bold"
                        >
                          <option value="Cleared">Cleared (Passed)</option>
                          <option value="In Progress">In Progress (Ongoing)</option>
                          <option value="Arrear">Arrear (Need Reappearance)</option>
                        </select>
                      </div>
                      <div className="flex items-end justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingSubject(false)}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-black hover:bg-black/10 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-brand hover:brightness-95 text-black font-heading font-bold text-xs rounded-lg cursor-pointer border border-brand"
                        >
                          Save Course
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Marks Details Table */}
                <div className="border border-black/15 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-black/5 text-black font-heading text-[10px] uppercase tracking-wider border-b border-black/15">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">Subject Code</th>
                        <th className="py-2.5 px-3 font-bold">Course Title</th>
                        <th className="py-2.5 px-3 font-bold text-center">CAT 1</th>
                        <th className="py-2.5 px-3 font-bold text-center">CAT 2</th>
                        <th className="py-2.5 px-3 font-bold text-center">Model Exam</th>
                        <th className="py-2.5 px-3 font-bold text-center">End Sem</th>
                        <th className="py-2.5 px-3 font-bold text-center">Status</th>
                        <th className="py-2.5 px-3 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/15">
                      {((adminAcademicRecords.find((r) => r.sem === selectedAdminSem)?.subjects) || []).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-black/65">
                            No subject marks recorded for Semester {selectedAdminSem} yet.
                          </td>
                        </tr>
                      ) : (
                        (adminAcademicRecords.find((r) => r.sem === selectedAdminSem)?.subjects || []).map((sub) => (
                          <tr key={sub.id} className="hover:bg-black/5">
                            <td className="py-2.5 px-3 font-mono font-bold text-black">{sub.code}</td>
                            <td className="py-2.5 px-3 text-black">{sub.name}</td>
                            <td className="py-2.5 px-3 text-center font-mono">{sub.internal1}</td>
                            <td className="py-2.5 px-3 text-center font-mono">{sub.internal2}</td>
                            <td className="py-2.5 px-3 text-center font-mono">{sub.modelExam}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-black">{sub.semesterExam}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  sub.status === "Cleared"
                                    ? "bg-brand/15 text-black border border-brand/60"
                                    : sub.status === "Arrear"
                                    ? "bg-brand/15 text-black border border-brand/60"
                                    : "bg-brand/15 text-black border border-brand/60"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSubjectForm(sub);
                                    setIsEditingSubject(true);
                                  }}
                                  className="p-1 text-black/65 hover:text-black hover:bg-black/5 rounded cursor-pointer"
                                  title="Edit Marks"
                                >
                                  <PencilSquareIcon className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSubjectDelete(sub.id)}
                                  className="p-1 text-black/65 hover:text-black hover:bg-brand/15 rounded cursor-pointer"
                                  title="Delete Course"
                                >
                                  <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Save Academic Changes directly to Supabase */}
                <div className="flex items-center justify-between pt-3 border-t border-black/15">
                  <span className="text-[11px] text-black/65">
                    Changes will be saved directly to student's database record.
                  </span>
                  <button
                    type="button"
                    disabled={isSavingAcademics}
                    onClick={handleSaveAcademicChanges}
                    className="px-5 py-2.5 bg-brand hover:brightness-95 text-black font-heading font-bold text-xs rounded-md border border-brand transition cursor-pointer disabled:opacity-50"
                  >
                    {isSavingAcademics ? "Saving Changes to Database..." : "Save Academic Records"}
                  </button>
                </div>
              </div>
            ) : (
              <ScholarProfile onSaved={fetchStudents} key={selectedStudent.id} endpoint={`/admin/students/${selectedStudent.id}/profile`} />
            )}

            <div className="flex justify-end pt-2 border-t border-black/15">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 text-xs font-semibold rounded-md bg-black text-white hover:bg-black transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <SignOutModal
        isOpen={isSignOutModalOpen}
        onClose={() => setIsSignOutModalOpen(false)}
      />
    </div>
  );
}
