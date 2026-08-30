import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LoginGate from "./components/LoginGate";
import { restoreAccess, type AccessMode } from "./lib/auth";
import { TRIP_PUBLIC } from "./tripMeta";

export default function App() {
  const [mode, setMode] = useState<AccessMode | null>(() =>
    TRIP_PUBLIC ? "full" : restoreAccess()
  );

  if (!TRIP_PUBLIC && !mode) {
    return <LoginGate onUnlock={setMode} />;
  }

  const showDates = TRIP_PUBLIC || mode === "full";

  return (
    <Routes>
      <Route path="*" element={<Index showDates={showDates} />} />
    </Routes>
  );
}
