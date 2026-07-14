import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LoginGate from "./components/LoginGate";
import { restoreAccess, type AccessMode } from "./lib/auth";

export default function App() {
  const [mode, setMode] = useState<AccessMode | null>(() => restoreAccess());

  if (!mode) {
    return <LoginGate onUnlock={setMode} />;
  }

  return (
    <Routes>
      <Route path="*" element={<Index showDates={mode === "full"} />} />
    </Routes>
  );
}
