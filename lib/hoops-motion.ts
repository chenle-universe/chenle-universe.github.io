import { advanceBall, type BallState } from './physics.ts';

export type MovingCourt = { phase: number; hoop: number; ball: BallState };
export const hoopAtPhase = (phase: number) => 200 + Math.sin(phase) * 55;

// Every frame advances the same court clock, including aiming and ball flight.
export function advanceCourt(court: MovingCourt, dt: number) {
  court.phase += dt * 1.2;
  court.hoop = hoopAtPhase(court.phase);
  return court.ball.flying ? advanceBall(court.ball, court.hoop, dt) : 0;
}
