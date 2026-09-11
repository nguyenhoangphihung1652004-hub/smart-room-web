import React, { useEffect, useState } from "react";
import { database } from "./firebase";
import { ref, onValue, set } from "firebase/database";

function App() {
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [isOverheat, setIsOverheat] = useState(false);
  const [fanRelay, setFanRelay] = useState(false);

  useEffect(() => {
    // Lắng nghe dữ liệu cảm biến
    const sensorRef = ref(database, "smart_room/sensor_data");
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTemperature(data.temperature || 0);
        setHumidity(data.humidity || 0);
      }
    });

    // Lắng nghe cảnh báo
    const alertRef = ref(database, "smart_room/alerts/is_overheat");
    const unsubscribeAlert = onValue(alertRef, (snapshot) => {
      setIsOverheat(snapshot.val() || false);
    });

    // Lắng nghe trạng thái quạt
    const controlRef = ref(database, "smart_room/control/fan_relay");
    const unsubscribeControl = onValue(controlRef, (snapshot) => {
      setFanRelay(snapshot.val() || false);
    });

    return () => {
      unsubscribeSensor();
      unsubscribeAlert();
      unsubscribeControl();
    };
  }, []);

  const toggleFan = () => {
    const fanRef = ref(database, "smart_room/control/fan_relay");
    set(fanRef, !fanRelay);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>IoT Smart Room Dashboard</h1>

      {isOverheat && (
        <div style={{ backgroundColor: "#ff4d4d", color: "#fff", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
          ⚠️ <strong>CẢNH BÁO:</strong> Nhiệt độ phòng vượt ngưỡng an toàn (&gt;35°C)!
        </div>
      )}

      <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
        <div style={{ flex: 1, padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
          <h2>Nhiệt độ</h2>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "#007bff" }}>{temperature} °C</p>
        </div>
        <div style={{ flex: 1, padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
          <h2>Độ ẩm</h2>
          <p style={{ fontSize: "32px", fontWeight: "bold", color: "#007bff" }}>{humidity} %</p>
        </div>
      </div>

      <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "8px" }}>
        <h2>Điều khiển thiết bị</h2>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
          <span>Trạng thái quạt: <strong>{fanRelay ? "ĐANG BẬT" : "ĐANG TẮT"}</strong></span>
          <button 
            onClick={toggleFan} 
            style={{ padding: "10px 20px", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold", backgroundColor: fanRelay ? "#e74c3c" : "#2ecc71" }}
          >
            {fanRelay ? "TẮT QUẠT" : "BẬT QUẠT"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;