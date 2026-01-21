import { Routes, Route, useNavigate} from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import HomePage from "./pages/HomePage";
import AICheckPage from "./pages/AICheckPage";
import AddressPage from "./pages/AddressPage";
import ResultPage from "./pages/ResultPage";
import "./styles/base.css";
import "./styles/components.css";
import { useEstimateStore } from "./store/estimateStore";
import { useEffect } from "react";

function App() {
  const navigate = useNavigate();
  // const location = useLocation();
  const reset = useEstimateStore((state) => state.reset)

  useEffect(()=>{
    const nav = performance.getEntriesByType("navigation")[0];

    if (nav?.type === "reload") {
      reset();
      navigate("/HomePage", { replace: true });
    }
  }, []);

  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />

      <main className="flex-fill">
        <div className="container">
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/HomePage" element={<HomePage />} />
              <Route path="/AICheckPage" element={<AICheckPage />} />
              <Route path="/AddressPage" element={<AddressPage />} />
              <Route path="/ResultPage" element={<ResultPage />} />
            </Routes>
          </div>
          
        </div>
      </main>

      <Footer />
    </div>
  );
}


export default App;