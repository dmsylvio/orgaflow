import type { Metadata } from "next";
import TeamClientPage from "./client-page";

export const metadata: Metadata = {
  title: "Team",
  description: "Invite and manage team members.",
};

export default function TeamPage() {
  return <TeamClientPage />;
}

