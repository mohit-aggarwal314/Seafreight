import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import BoxVisualizer from "./BoxVisualizer";


function App() {

  const canvasRef = useRef();
  const [items, setItems] = useState([
    { length: "", width: "", height: "", weight: "", fragile: false, heavy: false },
  ]);
  const [totalWeight, setTotalWeight] = useState(0);
  const [cbm, setCbm] = useState(null);
  const [suggestedContainer, setSuggestedContainer] = useState("");

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addNewItem = () => {
    setItems([
      ...items,
      { length: "", width: "", height: "", weight: "", fragile: false, heavy: false },
    ]);
  };

  const calculateCBM = () => {
    let total = 0;
    let weight = 0;

    items.forEach((item) => {
      const { length, width, height, weight: w } = item;

      if (length && width && height) {
        total +=
          (Number(length) / 100) *
          (Number(width) / 100) *
          (Number(height) / 100);
      }

      if (w) {
        weight += Number(w);
      }
    });

    setCbm(total.toFixed(3));
    setTotalWeight(weight);

    if (total <= 28) setSuggestedContainer("20ft Container");
    else if (total <= 58) setSuggestedContainer("40ft Container");
    else setSuggestedContainer("Requires multiple containers or 40HC");

    setTimeout(saveShipment, 500);
  };

  

  const exportPDF = () => {
    const doc = new jsPDF();
    let y = 10;

    doc.setFontSize(16);
    doc.text("Sea Freight Load Report", 10, y);
    y += 10;

    doc.setFontSize(12);

    let totalWeight = 0;

    items.forEach((item, index) => {
      const weight = Number(item.weight) || 0;
      totalWeight += weight;

      doc.text(
        `Item ${index + 1}: ${item.length}cm x ${item.width}cm x ${item.height}cm, Weight: ${weight}kg`,
        10,
        y
      );
      y += 6;
      doc.text(
        `   Fragile: ${item.fragile ? "Yes" : "No"}, Heavy: ${item.heavy ? "Yes" : "No"
        }`,
        10,
        y
      );
      y += 10;
    });

    doc.text(`Total CBM: ${cbm} m³`, 10, y);
    y += 10;
    doc.text(`Total Weight: ${totalWeight} kg`, 10, y);
    y += 10;
    doc.text(`Suggested Container: ${suggestedContainer}`, 10, y);

    // Snapshot 3D view after frame renders
    const container = canvasRef.current;
    const canvas = container?.querySelector("canvas");

    if (!canvas) {
      alert("Canvas not found");
      doc.save("sea_freight_report.pdf");
      return;
    }

    requestAnimationFrame(() => {
      try {
        const imgData = canvas.toDataURL("image/png");
        doc.addPage();
        doc.setFontSize(14);
        doc.text("3D Load Visualization", 10, 20);
        doc.addImage(imgData, "PNG", 10, 30, 180, 100);
        doc.save("sea_freight_report.pdf");
      } catch (err) {
        console.error("Error generating canvas image", err);
        alert("Could not export canvas image.");
      }
    });
  };

  const saveShipment = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/shipments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          cbm,
          weight: totalWeight,
          container: suggestedContainer,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();
      console.log("Shipment saved:", data.message);
    } catch (error) {
      console.error("Error saving shipment:", error);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full bg-white p-6 rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Sea Freight Load Calculator
        </h1>

        {items.map((item, index) => (
          <div key={index} className="border rounded p-4 mb-4 bg-gray-50">
            <p className="font-semibold mb-2">Item {index + 1}</p>
            <div className="grid grid-cols-2 gap-4 mb-2">
              <input
                type="number"
                placeholder="Length (cm)"
                className="border rounded p-2"
                value={item.length}
                onChange={(e) =>
                  handleItemChange(index, "length", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Width (cm)"
                className="border rounded p-2"
                value={item.width}
                onChange={(e) =>
                  handleItemChange(index, "width", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Height (cm)"
                className="border rounded p-2"
                value={item.height}
                onChange={(e) =>
                  handleItemChange(index, "height", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Weight (kg)"
                className="border rounded p-2"
                value={item.weight}
                onChange={(e) =>
                  handleItemChange(index, "weight", e.target.value)
                }
              />
              <div className="flex space-x-4 col-span-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={item.fragile}
                    onChange={(e) =>
                      handleItemChange(index, "fragile", e.target.checked)
                    }
                  />
                  <span>Fragile</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={item.heavy}
                    onChange={(e) =>
                      handleItemChange(index, "heavy", e.target.checked)
                    }
                  />
                  <span>Heavy</span>
                </label>
              </div>
            </div>
          </div>
        ))}

        <button
          className="mb-4 px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          onClick={addNewItem}
        >
          + Add Another Item
        </button>

        <button
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          onClick={calculateCBM}
        >
          Calculate
        </button>
        {cbm && (
          <button
            className="w-full bg-green-600 text-white py-2 mt-4 rounded hover:bg-green-700 transition"
            onClick={exportPDF}
          >
            Export as PDF
          </button>
        )}

        {cbm && (
          <div className="mt-6 bg-gray-50 p-4 rounded border text-center">
            <p className="text-lg font-semibold">Total CBM: {cbm} m³</p>
            <p className="mt-2 text-blue-700 font-medium">
              Suggested Container: {suggestedContainer}
            </p>
            <p className="mt-2 font-medium">
              Total Weight: {totalWeight} kg
            </p>
          </div>
        )}

        {cbm && (
          <BoxVisualizer items={items} canvasRef={canvasRef} />
        )}
      </div>
    </div>
  );
}

export default App;
