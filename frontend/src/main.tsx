import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { FoodDatabase } from "./components/FoodDatabase";
import { WeeklyPlan } from "./components/WeeklyPlan";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<FoodDatabase />} />
          <Route path="weekly-plan" element={<WeeklyPlan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
