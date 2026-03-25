import type { Metadata } from "next";
import { WorkspaceScreen } from "./workspace-screen";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Choose or create an organization to continue.",
  robots: { index: false, follow: false },
};

export default function WorkspacePage() {
  return <WorkspaceScreen />;
}
