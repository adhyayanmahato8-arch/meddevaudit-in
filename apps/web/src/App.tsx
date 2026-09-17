import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NewAudit from "./pages/NewAudit";
import AuditReport from "./pages/AuditReport";
import AuditHistory from "./pages/AuditHistory";
import RuleLibrary from "./pages/RuleLibrary";
import References from "./pages/References";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="new" element={<NewAudit />} />
        <Route path="history" element={<AuditHistory />} />
        <Route path="audits/:id" element={<AuditReport />} />
        <Route path="rules" element={<RuleLibrary />} />
        <Route path="references" element={<References />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
