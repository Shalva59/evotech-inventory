"use client";


import { useEffect, useMemo, useState } from "react";


const Page = () => {

  const [color, setColor] = useState(true);
  const [changeActive, setchangeActive] = useState(true);


  const startItems = [
    { id: 1, name: "Nike", isActive: false },
    { id: 2, name: "Adidas", isActive: true },
    { id: 3, name: "Puma", isActive: false },
  ];


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

  // POST — ახალი ბრენდის შექმნა
  const [brandName, setBrandName] = useState("");
  const [postResult, setPostResult] = useState(null);
  const [postError, setPostError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const createBrand = async () => {
    setLoading(true);
    setPostResult(null);
    setPostError(null);

    try {
      const response = await fetch("http://localhost:4000/api/v1/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: brandName, isActive: isActive }), // Assuming new brands are active by default
      });

      // 201 = შეიქმნა, 400 = ვალიდაციის შეცდომა, 409 = ასეთი სახელი უკვე არსებობს
      const result = await response.json().catch(() => null);
      console.log("POST response:", response.status, result);

      if (!response.ok) {
        const message =
          result?.errors
            ? Object.values(result.errors).flat().join(" ")
            : result?.detail || result?.title || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }

      setPostResult(result);
      setBrandName("");
    } catch (err) {
      console.error("Error creating brand:", err);
      setPostError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>

      <h1>Brands Test Page</h1>

      <div style={{ margin: "20px 0", padding: "12px", border: "1px solid #ccc" }}>
        <h3>POST /api/v1/brands</h3>
        <input
          type="text"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          placeholder="ბრენდის სახელი"
          style={{ border: "1px solid #999", padding: "6px", marginRight: "8px" }}
        />
        <input type="checkbox" checked={isActive} onChange={() => setIsActive(!isActive)} />

        <label htmlFor="isActive">IsActive</label>

        <button
          onClick={createBrand}
          disabled={loading}
          style={{ padding: "6px 14px", background: "#2563eb", color: "white", borderRadius: "4px" }}
        >
          {loading ? "იგზავნება..." : "გაგზავნა (POST)"}
        </button>

        {postResult && (
          <p style={{ color: "green" }}>
            შეიქმნა: #{postResult.id} — {postResult.name}
          </p>
        )}
        {postError && <p style={{ color: "red" }}>შეცდომა: {postError}</p>}
      </div>
      <h2>Welcome to the Brands Test Page!</h2>
      <p>This page is used for testing the Brands component.</p>


      <input type="checkbox" checked={color} onChange={() => setColor(!color)} />

      {color ? (<h1 style={{ color: "green", fontSize: "30px" }}>Color is Green</h1>) :
        (<h1 style={{ color: "red", fontSize: "30px" }}>Color is Red</h1>)}




      <input type="checkbox" checked={changeActive} onChange={() => {
        setchangeActive(!changeActive)

        let startItemsReturn = null;

        startItems?.map((item) => {

          item.isActive = changeActive ? true : false;

          console.log(item.name + "  ,  " + item.isActive);

        })

        return startItemsReturn = startItems;

      }} /> Sellect all

      {startItems.map((item) => {

        return (



          <div key={item.id} style={{ marginBottom: "10px" }}>
            <span>{item.name}</span>
            {item.isActive ? (
              <span style={{ color: "green", marginLeft: "10px" }}>Active</span>
            ) : (
              <span style={{ color: "red", marginLeft: "10px" }}>Inactive</span>
            )}
          </div>
        );
      })}
    </div>
  )
}

export default Page
