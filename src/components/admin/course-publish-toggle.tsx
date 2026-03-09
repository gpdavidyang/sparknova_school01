"use client";

import { useState } from "react";

interface Props {
  slug: string;
  courseId: string;
  initialPublished: boolean;
}

export function CoursePublishToggle({ slug, courseId, initialPublished }: Props) {
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${slug}/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      if (res.ok) setIsPublished((p) => !p);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
        isPublished ? "bg-orange-500" : "bg-gray-200"
      } ${loading ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          isPublished ? "translate-x-4" : "translate-x-1"
        }`}
      />
    </button>
  );
}
