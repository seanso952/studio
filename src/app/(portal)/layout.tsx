// This file is part of a conflicting route group (portal).
// The active layout can be found at /portal/layout.tsx
// To resolve the conflict, please delete the src/app/(portal) directory.
export default function ConflictingPlaceholderLayout({ children }: { children: React.ReactNode }) {
  // Returning null or a minimal fragment should prevent it from interfering.
  return null;
}
