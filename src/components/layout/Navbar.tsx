"use client";

import Link from "next/link";
import { useAuth } from "@/src/contexts/AuthContext";
import { Button } from "@/src/components/ui/Button";
import { ThemeToggle } from "../theme/ThemeToggle";

export function Navbar() {
  const { admin, logout } = useAuth();

  if (!admin) return null;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="text-xl font-bold text-blue-600 dark:text-blue-400"
            >
              Credenciamento
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {admin.name}
            </span>

            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout}>
              Sair
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
