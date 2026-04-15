import { Server } from 'socket.io';
import { getConnectedTenantIds } from '../routes/socket.config';

interface MockVehicleState {
  vehicleId: string;
  plate: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  status: 'moving' | 'idle';
}

let telemetryInterval: NodeJS.Timeout | null = null;

const mockVehicle: MockVehicleState = {
  vehicleId: '123',
  plate: '34 ABC 12',
  lat: 37.0662,
  lng: 37.3833,
  speed: 45,
  heading: 90,
  status: 'moving',
};

function stepVehicle(state: MockVehicleState): void {
  const latDelta = (Math.random() - 0.5) * 0.0012;
  const lngDelta = (Math.random() - 0.5) * 0.0012;

  state.lat = Number((state.lat + latDelta).toFixed(6));
  state.lng = Number((state.lng + lngDelta).toFixed(6));
  state.speed = Math.max(8, Math.min(72, Math.round(state.speed + (Math.random() - 0.5) * 8)));
  state.heading = (state.heading + Math.round((Math.random() - 0.5) * 30) + 360) % 360;
  state.status = state.speed > 10 ? 'moving' : 'idle';
}

export function startMockTelemetryService(io: Server): void {
  if (telemetryInterval) return;

  telemetryInterval = setInterval(() => {
    stepVehicle(mockVehicle);

    const connectedTenantIds = getConnectedTenantIds();
    if (connectedTenantIds.length === 0) return;

    for (const tenantId of connectedTenantIds) {
      const locationPayload = {
        vehicleId: mockVehicle.vehicleId,
        plate: mockVehicle.plate,
        lat: mockVehicle.lat,
        lng: mockVehicle.lng,
        speed: mockVehicle.speed,
        status: mockVehicle.status,
        heading: mockVehicle.heading,
      };

      io.to(`room:${tenantId}`).emit('vehicle:location_update', locationPayload);
      io.to(`tenant:${tenantId}`).emit('vehicle:location_update', locationPayload);
      io.to(`tenant:${tenantId}`).emit('vehicle:telemetry', {
        ...locationPayload,
        tenantId,
        timestamp: new Date().toISOString(),
      });
    }
  }, 3_000);

  console.log('[MockTelemetry] Service started (3s interval)');
}

export function stopMockTelemetryService(): void {
  if (!telemetryInterval) return;
  clearInterval(telemetryInterval);
  telemetryInterval = null;
  console.log('[MockTelemetry] Service stopped');
}
