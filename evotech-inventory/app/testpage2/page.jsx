"use client"

import React from 'react'
import { useEffect, useState } from 'react'

const page = () => {

  const [brands, setBrands] = useState(null);

  const fetchdata = async () => {
    const response = await fetch('http://localhost:4000/api/v1/brands');
    const data = await response.json();
    console.log(data);

    setBrands(data);

  }

  useEffect(() => {
    fetchdata();
  }, []);

  return (
    <div>

      {brands && brands.map((brand) => (
        <div key={brand.id} style={{ border: "1px solid black", padding: "10px", margin: "10px" }}>
          <h2 >{brand.name}</h2>

          <input type="checkbox" checked={brand.isActive} onChange={() => {
            const updatedBrands = brands.map((b) => {
              if (b.id === brand.id) {
                return { ...b, isActive: !b.isActive };
              }
              return b;
            });

            setBrands(updatedBrands);
          }
          } />

          {brand.isActive ? (
            <span style={{ color: "green" }}> Active</span>
          ) : (
            <span style={{ color: "red" }}> Inactive</span>
          )}

        </div>
      ))}



      <h1 style={{ color: "blue", fontSize: "40px" }}>This is Test Page 2</h1>
      <p style={{ color: "green", fontSize: "30px" }}>Welcome to the test page 2 of the application.</p>
      <p style={{ color: "red", fontSize: "20px" }}>This page is under construction.</p>



    </div>
  )
}

export default page
