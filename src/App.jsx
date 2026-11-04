import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { ProjectPage } from "./pages/ProjectPage";
import { NotFound } from "./pages/NotFound";
import { Toaster } from "@/components/ui/Toaster";

// O admin fica em um pacote separado: quem visita o site não baixa esse código.
const AdminApp = lazy(() => import("./admin/AdminApp"));

function App() {
  return (
    <>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route index element={<Home />} />
          <Route path="projeto/:slug" element={<ProjectPage />} />
          <Route
            path="admin/*"
            element={
              <Suspense fallback={<div className="min-h-screen bg-background" />}>
                <AdminApp />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
