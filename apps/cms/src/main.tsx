import React from "react";
import ReactDOM from "react-dom/client";
import "./cms.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ShowList from "./pages/ShowList";
import ShowEditor from "./pages/ShowEditor";
import Publish from "./pages/Publish";
import Dashboard from "./pages/Dashboard";
import RequireAuth from "./components/RequireAuth";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <ShowList />
            </RequireAuth>
          }
        />
        <Route
          path="/shows/:id"
          element={
            <RequireAuth>
              <ShowEditor />
            </RequireAuth>
          }
        />
        <Route
          path="/publish"
          element={
            <RequireAuth>
              <Publish />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
