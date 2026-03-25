import type { Metadata } from "next";
import KanbanClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Kanban",
  description: "Configure Kanban board stages and behavior.",
};

export default function KanbanPage() {
  return <KanbanClientPage />;
}

