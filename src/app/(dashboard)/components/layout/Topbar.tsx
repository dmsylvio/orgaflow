"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import Logo from "./logo";
import { MenuIcon } from "lucide-react";

export function Topbar() {
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      await authClient.signOut();
      window.location.href = "/auth/sign-in";
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 z-20 flex items-center justify-between w-full px-4 py-3 md:h-16 md:px-8 bg-linear-to-r from-mauve-800 to-mauve-700">
      <Link
        href="/app"
        className="float-none text-lg not-italic font-black tracking-wider text-white brand-main md:float-left font-base hidden md:block"
      >
        <Logo className="w-32 h-14 fill-white" />
      </Link>
      <div className="flex float-left p-1 overflow-visible text-sm ease-linear bg-white border-0 rounded cursor-pointer md:hidden md:ml-0 hover:bg-gray-100">
        <MenuIcon className="h-6 w-6 text-gray-500" />
      </div>
      <ul className="flex float-right h-8 m-0 list-none md:h-9">
        <li className="relative hidden float-left m-0 md:block"></li>
      </ul>
    </header>
  );
}
