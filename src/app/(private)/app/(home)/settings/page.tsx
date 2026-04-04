import { redirect } from "next/navigation";

export default function SettingsHomePage() {
  redirect("/app/settings/account");
}
