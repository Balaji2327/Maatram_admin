"use client";

import React from "react";
import { TrashIcon, XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  description?: string;
  confirmButtonText?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Confirmation",
  itemName,
  description,
  confirmButtonText = "Delete Permanently",
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-150">
      <div
        className="fixed inset-0"
        onClick={!isDeleting ? onClose : undefined}
        aria-hidden="true"
      />

      <div className="bg-white rounded-xl border border-black/15 shadow-sm p-6 sm:p-7 max-w-sm sm:max-w-md w-full relative z-10 animate-in zoom-in-95 duration-150 text-center">
        {/* Close Button top-right */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 text-black/65 hover:text-black rounded-full hover:bg-black/5 transition cursor-pointer disabled:opacity-50"
          aria-label="Close modal"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Warning Trash Icon Badge */}
        <div className="w-14 h-14 bg-brand/15 border border-brand/60 rounded-lg flex items-center justify-center mx-auto text-black mb-4">
          <TrashIcon className="w-7 h-7 stroke-[2]" />
        </div>

        {/* Title */}
        <h3 className="font-heading font-bold text-xl sm:text-2xl text-black tracking-tight">
          {title}
        </h3>

        {/* Optional Item Highlight */}
        {itemName && (
          <div className="my-2.5 px-3 py-1.5 bg-black/5 border border-black/15 rounded-md text-xs sm:text-sm font-semibold text-black break-words line-clamp-2">
            &ldquo;{itemName}&rdquo;
          </div>
        )}

        {/* Description */}
        <p className="font-primary text-xs sm:text-sm text-black mt-2 leading-relaxed">
          {description ||
            "This action cannot be undone. It will be permanently removed from the database and all media will be deleted from cloud storage."}
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-md text-xs sm:text-sm font-heading font-bold text-black bg-black/5 hover:bg-black/10 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3 px-4 rounded-md text-xs sm:text-sm font-heading font-bold text-white bg-black hover:bg-black transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-70"
          >
            <TrashIcon className="w-4 h-4" />
            <span>{isDeleting ? "Deleting..." : confirmButtonText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
