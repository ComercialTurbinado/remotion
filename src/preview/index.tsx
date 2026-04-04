import React from "react";
import { createRoot } from "react-dom/client";
import { PreviewApp } from "./PreviewApp";

const el = document.getElementById("root");
if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <PreviewApp />
    </React.StrictMode>
  );
}
