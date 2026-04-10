/**
 * IoT Device Integration Service
 * 
 * Provides interfaces and utilities for connecting to IoT-enabled
 * ophthalmic testing devices via Web Bluetooth, WebUSB, and WebSocket.
 * 
 * Supported device types:
 * - Distance sensors (ultrasonic/IR for patient positioning)
 * - Lux meters (ambient light measurement)
 * - Autorefractors (objective refraction data)
 * - Occluders (motorized eye cover devices)
 */

export type DeviceType = 'distance_sensor' | 'lux_meter' | 'autorefractor' | 'occluder';
export type ConnectionMethod = 'bluetooth' | 'usb' | 'websocket' | 'serial';
export type DeviceStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'calibrating';

export interface IoTDevice {
  id: string;
  name: string;
  type: DeviceType;
  connection: ConnectionMethod;
  status: DeviceStatus;
  battery?: number;
  firmware?: string;
  lastReading?: any;
  error?: string;
}

export interface DistanceReading {
  distanceCm: number;
  confidence: number;
  timestamp: number;
}

export interface LuxReading {
  lux: number;
  isAdequate: boolean;
  timestamp: number;
}

export interface DeviceCapabilities {
  bluetooth: boolean;
  usb: boolean;
  serial: boolean;
  websocket: boolean;
}

// Well-known BLE service UUIDs for ophthalmic devices
const BLE_SERVICES = {
  DISTANCE_SENSOR: '0000180f-0000-1000-8000-00805f9b34fb',
  LUX_METER: '00001810-0000-1000-8000-00805f9b34fb',
  GENERIC_DEVICE: '0000180a-0000-1000-8000-00805f9b34fb',
};

/**
 * Check which connectivity APIs are available in the browser
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  return {
    bluetooth: 'bluetooth' in navigator,
    usb: 'usb' in navigator,
    serial: 'serial' in navigator,
    websocket: 'WebSocket' in window,
  };
}

/**
 * Scan for BLE ophthalmic devices
 */
export async function scanBluetoothDevices(): Promise<IoTDevice | null> {
  if (!('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth not supported in this browser');
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [
        { services: [BLE_SERVICES.DISTANCE_SENSOR] },
        { services: [BLE_SERVICES.LUX_METER] },
        { namePrefix: 'EyeTest' },
        { namePrefix: 'OphthaDevice' },
      ],
      optionalServices: [BLE_SERVICES.GENERIC_DEVICE],
    });

    return {
      id: device.id,
      name: device.name || 'Unknown Device',
      type: 'distance_sensor',
      connection: 'bluetooth',
      status: 'connecting',
    };
  } catch (err: any) {
    if (err.name === 'NotFoundError') return null; // User cancelled
    throw err;
  }
}

/**
 * Connect to a WebSocket-based IoT hub (e.g., local gateway)
 */
export function connectWebSocketDevice(
  url: string,
  onMessage: (data: any) => void,
  onStatusChange: (status: DeviceStatus) => void
): { disconnect: () => void } {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let retries = 0;
  const maxRetries = 3;

  const connect = () => {
    onStatusChange('connecting');
    ws = new WebSocket(url);

    ws.onopen = () => {
      retries = 0;
      onStatusChange('connected');
      // Send handshake
      ws?.send(JSON.stringify({ type: 'handshake', protocol: 'eyetest-iot-v1' }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch {}
    };

    ws.onerror = () => {
      onStatusChange('error');
    };

    ws.onclose = () => {
      if (retries < maxRetries) {
        retries++;
        reconnectTimer = setTimeout(connect, 2000 * retries);
      } else {
        onStatusChange('disconnected');
      }
    };
  };

  connect();

  return {
    disconnect: () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      retries = maxRetries; // Prevent reconnection
      ws?.close();
      onStatusChange('disconnected');
    },
  };
}

/**
 * Connect via Web Serial API (USB-serial adapters, Arduino-based devices)
 */
export async function connectSerialDevice(): Promise<{
  device: IoTDevice;
  port: any;
  disconnect: () => Promise<void>;
} | null> {
  if (!('serial' in navigator)) {
    throw new Error('Web Serial API not supported');
  }

  try {
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 115200 });

    const device: IoTDevice = {
      id: `serial-${Date.now()}`,
      name: 'Serial Sensor',
      type: 'distance_sensor',
      connection: 'serial',
      status: 'connected',
    };

    return {
      device,
      port,
      disconnect: async () => {
        try { await port.close(); } catch {}
      },
    };
  } catch (err: any) {
    if (err.name === 'NotFoundError') return null;
    throw err;
  }
}

/**
 * Parse distance reading from raw sensor data
 */
export function parseDistanceReading(raw: ArrayBuffer | string): DistanceReading {
  let distanceCm = 0;
  let confidence = 0;

  if (typeof raw === 'string') {
    // JSON format: { "d": 52.3, "c": 0.95 }
    try {
      const parsed = JSON.parse(raw);
      distanceCm = parsed.d || parsed.distance || 0;
      confidence = parsed.c || parsed.confidence || 0;
    } catch {
      // CSV format: "52.3,0.95"
      const parts = raw.split(',');
      distanceCm = parseFloat(parts[0]) || 0;
      confidence = parseFloat(parts[1]) || 0;
    }
  } else {
    // Binary format: first 4 bytes = float distance, next 4 = float confidence
    const view = new DataView(raw);
    distanceCm = view.getFloat32(0, true);
    confidence = view.getFloat32(4, true);
  }

  return { distanceCm, confidence, timestamp: Date.now() };
}

/**
 * Validate if patient is at correct distance for Snellen chart
 */
export function validateDistance(reading: DistanceReading): {
  isValid: boolean;
  status: 'too_close' | 'correct' | 'too_far';
  message: string;
} {
  const target = 50; // Standard 50cm for screen-based tests
  const tolerance = 5; // ±5cm

  if (reading.distanceCm < target - tolerance) {
    return { isValid: false, status: 'too_close', message: `Move back ${Math.round(target - reading.distanceCm)}cm` };
  }
  if (reading.distanceCm > target + tolerance) {
    return { isValid: false, status: 'too_far', message: `Move closer ${Math.round(reading.distanceCm - target)}cm` };
  }
  return { isValid: true, status: 'correct', message: 'Perfect distance' };
}

/**
 * Get formatted device info string for test records
 */
export function getDeviceInfoString(): string {
  const ua = navigator.userAgent;
  const screen = `${window.screen.width}×${window.screen.height}`;
  const dpr = window.devicePixelRatio?.toFixed(1) || '1.0';
  const platform = navigator.platform || 'Unknown';
  return `${platform} | ${screen} @${dpr}x | ${ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : ua.includes('Safari') ? 'Safari' : 'Other'}`;
}
