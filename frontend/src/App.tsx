import { Outlet, Link, useLocation } from "react-router-dom";
import { Database, CalendarDays } from "lucide-react";
import "./App.css";

export function App() {
  const location = useLocation();

  return (
    <div className="app-root">
      <nav className="app-nav">
        <div className="app-nav-inner">
          <div className="app-nav-left">
            <h1 className="app-brand">WhatToEat</h1>
            <div className="app-nav-tabs">
              <Link
                to="/"
                className={`nav-tab ${
                  location.pathname === "/"
                    ? "nav-tab--active"
                    : ""
                }`}
              >
                <Database className="nav-tab__icon" />
                Food Database
              </Link>
              <Link
                to="/weekly-plan"
                className={`nav-tab ${
                  location.pathname === "/weekly-plan"
                    ? "nav-tab--active"
                    : ""
                }`}
              >
                <CalendarDays className="nav-tab__icon" />
                Weekly Plan
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
