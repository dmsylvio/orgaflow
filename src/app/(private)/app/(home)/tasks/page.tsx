import type { Metadata } from "next";
import TasksClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Manage tasks and due dates in your Orgaflow workspace.",
};

export default function TasksPage() {
  return <TasksClientPage />;
}

