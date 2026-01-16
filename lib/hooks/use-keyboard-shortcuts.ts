"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const useKeyboardShortcuts = () => {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "c":
          e.preventDefault();
          router.push("/mail/compose");
          break;
        case "i":
          e.preventDefault();
          router.push("/mail/inbox");
          break;
        case "s":
          e.preventDefault();
          router.push("/mail/starred");
          break;
        case "d":
          e.preventDefault();
          router.push("/mail/drafts");
          break;
        case "t":
          e.preventDefault();
          router.push("/mail/trash");
          break;
        case "/":
          e.preventDefault();
          // Find the search input and focus it
          const searchInput = document.querySelector(
            'input[placeholder*="Search"]',
          ) as HTMLInputElement;
          searchInput?.focus();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);
};
