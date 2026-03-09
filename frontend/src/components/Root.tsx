import { Outlet, Link, useLocation } from "react-router-dom";
import { Database, CalendarDays } from "lucide-react";

export function Root() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center gap-8">
            <h1 className="font-bold text-2xl text-gray-900">WhatToEat</h1>
            <div className="flex gap-3">
              <Link
                to="/"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                  location.pathname === "/"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Database className="w-4 h-4" />
                Food Database
              </Link>
              <Link
                to="/weekly-plan"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                  location.pathname === "/weekly-plan"
                    ? "bg-blue-500 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Weekly Plan
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
