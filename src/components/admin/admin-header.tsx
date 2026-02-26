import AdminGlobalSearch from "./header/admin-global-search";
import AdminLogo from "./header/admin-logo";
import AdminQuickActions from "./header/admin-quick-actions";
import AdminUserMenu from "./header/admin-user-menu";

export default function AdminHeader() {
  return (
    <header className="fixed top-0 left-0 z-20 flex items-center justify-between w-full px-4 py-3 md:h-16 md:px-8 bg-black">
      <AdminLogo />
      <ul className="m-0 flex h-10 list-none items-center md:h-11">
        <li className="relative hidden md:block">
          <AdminQuickActions />
        </li>

        <li className="ml-2">
          <AdminGlobalSearch />
        </li>

        <li className="relative ml-2 block">
          <AdminUserMenu />
        </li>
      </ul>
    </header>
  );
}
