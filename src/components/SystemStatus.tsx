import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, MemoryStick, HardDrive, Wifi, Activity, Terminal } from "lucide-react";

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: string;
  uptime: string;
}

export default function SystemStatus() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: "CONNECTED",
    uptime: "00:00:00",
  });
  const [startTime] = useState(Date.now());
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toISOString()}] Jaggie Jarvis v2.0 initialized`,
    `[${new Date().toISOString()}] Neural network loaded`,
    `[${new Date().toISOString()}] Voice recognition ready`,
    `[${new Date().toISOString()}] System integration active`,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpu: Math.random() * 30 + 5,
        memory: Math.random() * 20 + 40,
        disk: Math.random() * 10 + 60,
        network: "CONNECTED",
        uptime: formatUptime(Date.now() - startTime),
      });

      if (Math.random() > 0.7) {
        const messages = [
          "Background scan complete",
          "Memory optimization cycle finished",
          "Knowledge graph index updated",
          "Voice model warmed up",
          "API connection healthy",
        ];
        setLogs((prev) => [
          ...prev.slice(-20),
          `[${new Date().toISOString()}] ${messages[Math.floor(Math.random() * messages.length)]}`,
        ]);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatUptime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    unit,
    color,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
    unit: string;
    color: string;
  }) => (
    <div className="bg-jarvis-dark/50 border border-jarvis-blue-dim/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[10px] font-mono text-jarvis-blue-dim tracking-wider">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-light text-white">{value.toFixed(1)}</span>
        <span className="text-xs text-jarvis-blue-dim mb-1">{unit}</span>
      </div>
      <div className="mt-2 h-1 bg-jarvis-dark rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard icon={Cpu} label="CPU LOAD" value={metrics.cpu} unit="%" color="text-jarvis-blue" />
        <MetricCard icon={MemoryStick} label="MEMORY" value={metrics.memory} unit="%" color="text-jarvis-orange" />
        <MetricCard icon={HardDrive} label="STORAGE" value={metrics.disk} unit="%" color="text-jarvis-green" />
        <div className="bg-jarvis-dark/50 border border-jarvis-blue-dim/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-jarvis-green" />
            <span className="text-[10px] font-mono text-jarvis-blue-dim tracking-wider">NETWORK</span>
          </div>
          <div className="text-lg font-light text-jarvis-green">{metrics.network}</div>
          <div className="mt-2 text-[10px] font-mono text-jarvis-blue-dim">LATENCY: {(Math.random() * 50 + 20).toFixed(0)}ms</div>
        </div>
      </div>

      <div className="bg-jarvis-dark/50 border border-jarvis-blue-dim/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-jarvis-blue" />
          <span className="text-[10px] font-mono text-jarvis-blue-dim tracking-wider">UPTIME</span>
        </div>
        <div className="text-3xl font-mono text-jarvis-blue text-glow tracking-widest">{metrics.uptime}</div>
      </div>

      <div className="bg-jarvis-dark/50 border border-jarvis-blue-dim/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-jarvis-blue-dim" />
          <span className="text-[10px] font-mono text-jarvis-blue-dim tracking-wider">SYSTEM LOGS</span>
        </div>
        <div className="h-40 overflow-y-auto font-mono text-[10px] space-y-1">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-jarvis-blue-dim/60"
            >
              {log}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
