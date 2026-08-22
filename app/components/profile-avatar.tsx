"use client";

import { useState } from "react";

interface ProfileAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.trim().slice(0, 2).toUpperCase();
  }
  return "U";
}

function getAvatarColor(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-sky-500 text-white",
    "bg-blue-600 text-white",
    "bg-indigo-600 text-white",
    "bg-emerald-600 text-white",
    "bg-violet-600 text-white",
    "bg-teal-600 text-white",
  ];
  return colors[Math.abs(hash) % colors.length];
}

export default function ProfileAvatar({
  name,
  email,
  image,
  size = "md",
  className = ""
}: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initials = getInitials(name, email);
  const colorClass = getAvatarColor(email || name || "user");

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-9 w-9 text-xs sm:h-9 sm:w-9 sm:text-xs",
    lg: "h-14 w-14 text-lg font-bold"
  }[size];

  if (image && !imageError) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-full border border-slate-200 shadow-2xs ${sizeClasses} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={name || email || "User profile"}
          referrerPolicy="no-referrer"
          onError={() => setImageError(true)}
          className="h-full w-full object-cover rounded-full"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold shadow-2xs ${colorClass} ${sizeClasses} ${className}`}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
