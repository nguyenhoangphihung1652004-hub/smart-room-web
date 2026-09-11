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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 p-6 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
            IoT Smart Room
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">Hệ thống giám sát & điều khiển thời gian thực</p>
        </div>

        {/* Banner Cảnh báo */}
        {isOverheat && (
          <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/50 text-rose-300 p-4 rounded-xl animate-pulse">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-sm">CẢNH BÁO QUÁ NHIỆT</p>
              <p className="text-xs text-rose-400">Nhiệt độ phòng vượt ngưỡng an toàn (&gt;35°C)!</p>
            </div>
          </div>
        )}

        {/* Khối Thông số Cảm biến */}
        <div className="grid grid-cols-2 gap-4">
          {/* Card Nhiệt độ */}
          <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-4 text-center hover:border-blue-500/50 transition-all">
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Nhiệt độ</p>
            <p className="text-3xl sm:text-4xl font-black text-blue-400 mt-2">
              {temperature} <span className="text-lg font-normal text-slate-300">°C</span>
            </p>
          </div>

          {/* Card Độ ẩm */}
          <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-4 text-center hover:border-cyan-500/50 transition-all">
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Độ ẩm</p>
            <p className="text-3xl sm:text-4xl font-black text-cyan-400 mt-2">
              {humidity} <span className="text-lg font-normal text-slate-300">%</span>
            </p>
          </div>
        </div>

        {/* Khối Điều khiển Thiết bị */}
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase text-slate-300 tracking-wider">
            Điều khiển thiết bị
          </h2>

          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${fanRelay ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
              <span className="text-sm text-slate-300">
                Trạng thái quạt: <strong className={fanRelay ? "text-emerald-400" : "text-slate-400"}>
                  {fanRelay ? "ĐANG BẬT" : "ĐANG TẮT"}
                </strong>
              </span>
            </div>

            <button
              onClick={toggleFan}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all transform active:scale-95 shadow-lg ${
                fanRelay
                  ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25"
                  : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25"
              }`}
            >
              {fanRelay ? "TẮT QUẠT" : "BẬT QUẠT"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;