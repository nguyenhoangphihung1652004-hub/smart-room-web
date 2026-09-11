import React, { useEffect, useState } from "react";
import { database } from "./firebase";
import { ref, onValue, set } from "firebase/database";

function App() {
  const [temperature, setTemperature] = useState(0);
  const [humidity, setHumidity] = useState(0);
  const [isOverheat, setIsOverheat] = useState(false);
  const [fanRelay, setFanRelay] = useState(false);
  
  // Dữ liệu lưu cho Biểu đồ & Lịch sử
  const [historyData, setHistoryData] = useState([]);
  const [logs, setLogs] = useState([]);

  // Hàm thêm log sự kiện
  const addLog = (message, type = "info") => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [{ id: Date.now(), time, message, type }, ...prev.slice(0, 4)]);
  };

  useEffect(() => {
    // Lắng nghe dữ liệu cảm biến
    const sensorRef = ref(database, "smart_room/sensor_data");
    const unsubscribeSensor = onValue(sensorRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const temp = data.temperature || 0;
        const hum = data.humidity || 0;
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setTemperature(temp);
        setHumidity(hum);

        // Lưu dữ liệu vào lịch sử vẽ biểu đồ (giữ tối đa 10 mẫu)
        setHistoryData((prev) => [
          ...prev.slice(-9),
          { time, temp, hum }
        ]);
      }
    });

    // Lắng nghe cảnh báo
    const alertRef = ref(database, "smart_room/alerts/is_overheat");
    const unsubscribeAlert = onValue(alertRef, (snapshot) => {
      const alertState = snapshot.val() || false;
      setIsOverheat(alertState);
      if (alertState) {
        addLog("Cảnh báo: Nhiệt độ phòng vượt ngưỡng 35°C!", "warning");
      }
    });

    // Lắng nghe trạng thái quạt
    const controlRef = ref(database, "smart_room/control/fan_relay");
    const unsubscribeControl = onValue(controlRef, (snapshot) => {
      const state = snapshot.val() || false;
      setFanRelay(state);
    });

    return () => {
      unsubscribeSensor();
      unsubscribeAlert();
      unsubscribeControl();
    };
  }, []);

  const toggleFan = () => {
    const fanRef = ref(database, "smart_room/control/fan_relay");
    const nextState = !fanRelay;
    set(fanRef, nextState);
    addLog(`Đã ${nextState ? "BẬT" : "TẮT"} quạt điều khiển`, "action");
  };

  // Tính chiều cao cột biểu đồ tương đối
  const maxTemp = 50;
  const maxHum = 100;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 p-6 space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-700/60 pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
              IoT Smart Room Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">Hệ thống giám sát & điều khiển thời gian thực</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Online
          </div>
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
          <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-4 text-center hover:border-blue-500/50 transition-all">
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Nhiệt độ</p>
            <p className="text-3xl sm:text-4xl font-black text-blue-400 mt-2">
              {temperature} <span className="text-lg font-normal text-slate-300">°C</span>
            </p>
          </div>

          <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-4 text-center hover:border-cyan-500/50 transition-all">
            <p className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Độ ẩm</p>
            <p className="text-3xl sm:text-4xl font-black text-cyan-400 mt-2">
              {humidity} <span className="text-lg font-normal text-slate-300">%</span>
            </p>
          </div>
        </div>

        {/* Biểu đồ biến thiên dữ liệu */}
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold uppercase text-slate-300 tracking-wider">
              Biểu đồ biến thiên (Thời gian thực)
            </h2>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1 text-blue-400"><span className="w-2.5 h-2.5 bg-blue-400 rounded-sm inline-block"></span> Nhiệt độ</span>
              <span className="flex items-center gap-1 text-cyan-400"><span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm inline-block"></span> Độ ẩm</span>
            </div>
          </div>

          <div className="h-32 flex items-end justify-between gap-2 pt-4 border-b border-slate-600/60 pb-1 px-2">
            {historyData.length === 0 ? (
              <p className="text-xs text-slate-500 w-full text-center my-auto">Đang chờ dữ liệu gửi về...</p>
            ) : (
              historyData.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end gap-1 group relative">
                  {/* Tooltip khi hover */}
                  <div className="absolute -top-8 hidden group-hover:flex flex-col items-center bg-slate-900 border border-slate-700 text-[10px] p-1 rounded z-10 whitespace-nowrap">
                    <span>Nhiệt: {item.temp}°C</span>
                    <span>Độ ẩm: {item.hum}%</span>
                  </div>
                  
                  {/* Cột hiển thị */}
                  <div className="w-full flex justify-center items-end gap-1 h-full">
                    <div 
                      className="w-1/2 bg-blue-400/80 rounded-t transition-all duration-300" 
                      style={{ height: `${Math.min((item.temp / maxTemp) * 100, 100)}%` }}
                    />
                    <div 
                      className="w-1/2 bg-cyan-400/80 rounded-t transition-all duration-300" 
                      style={{ height: `${Math.min((item.hum / maxHum) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-500 truncate w-full text-center">{item.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Khối Điều khiển Thiết bị */}
        <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase text-slate-300 tracking-wider">
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

        {/* Nhật ký hoạt động */}
        {logs.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-3 space-y-2">
            <p className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">Lịch sử sự kiện gần đây</p>
            <div className="space-y-1">
              {logs.map((log) => (
                <div key={log.id} className="text-xs flex justify-between items-center text-slate-400 border-b border-slate-800/50 pb-1">
                  <span className={log.type === "warning" ? "text-rose-400" : "text-slate-300"}>• {log.message}</span>
                  <span className="text-[10px] text-slate-500">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;