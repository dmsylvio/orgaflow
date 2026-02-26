import Link from "next/link";
import LogoWhite from "./logo-white";

export default function AdminLogo() {
  return (
    <Link href="/app" className="hidden md:block">
      <LogoWhite className="w-32 h-14 fill-white" />
    </Link>
  );
}
