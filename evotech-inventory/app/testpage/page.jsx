"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { useI18n } from "@/lib/i18n";
import { useState, useEffect } from "react";

export default function TestPage() {
  const { t } = useI18n();

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [clicked, setClicked] = useState(0);
  const [show, setShow] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/v1/brands");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (response.ok) {
        setSuccess("Data fetched successfully!");
      }


      console.log("Response status:", response);

      const result = await response.json();
      console.log("Fetched data:", result);
      setData(result);
     
    }

    catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);

    };


  }

  const handleclick = (item) => {
    setClicked(item + 1);
    // console.log("Clicked item:", clicked);
  }

  const handleclick2minus = (item) => {

    if (item > 0) {
      setClicked(item - 1);
    }

  }

  const handleclick3reset = () => {
    setClicked(0);
  }

  useEffect(() => {
    fetchData();
  }, []);


  useEffect(() => {

    if (clicked) {
      console.log("Clicked item:", clicked);
    }
    else {
      console.log("Clicked item :", clicked);
    }
  }, [clicked]);


  useEffect(() => {
    console.log("Show state changed:", show);
  }, [show]);

  return (
    <>
      <PageHeader title={t("nav.testpage")} />


      {data ? (
        <ul>
          {data.map((brand) => (
            <li key={brand.id}>{brand.id}: {brand.name}</li>
          ))}
        </ul>
      ) : (
        <h1 style={{ color: "blue", fontSize: "40px" }}>Loading...</h1>
      )}

      {success && <h1 style={{ color: "green", fontSize: "30px" }}>{success}</h1>}
      {error && <h1 style={{ color: "red", fontSize: "30px" }}>{error}</h1>}

      <main className="space-y-4 p-5">
        <h1>Test Page</h1>
        <p>This is a simple test page.</p>
        <h2>Features:</h2>
        <ul>
          <li>Feature 1</li>
          <li>Feature 2</li>
          <li>Feature 3</li>
        </ul>
      </main>

      <h1 style={{ color: "red", fontSize: "30px" }}>LENGTH :  {data?.length}</h1>

      {data?.sort((a, b) => b.id - a.id)?.map(item => (
        <div key={item.id} className="border p-4 mb-2 justify-between items-center flex">
          <ul>
            <li>ID: {item.id}</li>
            <li>Name: {item.name}</li>
            <li>Status: {item.isActive ? "Active" : "Inactive"}</li>
          </ul>
          <ul>
          </ul>
        </div>

      ))}

      <button style={{ backgroundColor: "blue", color: "white", padding: "10px 20px", border: "none", cursor: "pointer" }}
        onClick={() => handleclick(clicked)}>CLICK ME {clicked}
      </button>

      <button style={{ backgroundColor: "red", color: "white", padding: "10px 20px", border: "none", cursor: "pointer" }}
        onClick={() => handleclick2minus(clicked)}>CLICK ME MINUS {clicked}
      </button>

      <button style={{ backgroundColor: "gray", color: "white", padding: "10px 20px", border: "none", cursor: "pointer" }}
        onClick={() => handleclick3reset()}>RESET
      </button>

      <button style={{ backgroundColor: "green", color: "white", padding: "10px 20px", border: "none", cursor: "pointer" }}
        onClick={() => setShow(!show)}>TOGGLE SHOW
      </button>

      {show && <p style={{ color: "white", fontSize: "20px" , border: "9px solid purple", padding: "10px", borderRadius: "5px"
       }}>This is a toggled message!</p>}
    </>
  );
}
