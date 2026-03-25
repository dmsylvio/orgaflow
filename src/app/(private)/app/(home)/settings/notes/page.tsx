import type { Metadata } from "next";
import NotesClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Notes",
  description: "Configure notes settings for documents and tasks.",
};

export default function NotesPage() {
  return <NotesClientPage />;
}

