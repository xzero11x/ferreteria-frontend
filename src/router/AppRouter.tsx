import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Page from "@/app/dashboard/page";




const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Page />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
