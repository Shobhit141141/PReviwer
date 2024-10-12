import { useState } from "react";
import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import { Badge, Button } from "@radix-ui/themes/dist/cjs/index.js";
import Navbar from "./components/Navbar";
import PR from "./pages/Pr";
import toast, {Toaster}from 'react-hot-toast';
function App() {
  return (
    <>
      <BrowserRouter>
      <Toaster/>
      <Navbar/>
    
    <main className="pt-[60px]">
    <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/pr" element={<PR />} />
        </Routes>
    </main>
      </BrowserRouter>
    </>
  );
}

export default App;
