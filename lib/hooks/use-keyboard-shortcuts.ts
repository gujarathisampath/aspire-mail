"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const useKeyboardShortcuts = () => {
  const router = useRouter();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable || e.ctrlKey
      ) {
        return;
      }


      switch (e.key.toLowerCase()) {
        case "r":
          e.preventDefault();
          router.refresh();
          break;
        case "i":
          e.preventDefault();
          router.push("/mail/inbox");
          break;
        case "s":
          e.preventDefault();
          router.push("/mail/sent");
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
