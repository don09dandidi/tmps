/** A person seen by an armed camera. Immutable value object. */
export interface Alert {
  readonly cameraId: string;
  readonly cameraName: string;
  /** Where the camera sits in the property, e.g. "Proprietate › Curte". */
  readonly zone: string;
  /** Detector confidence, 0..1. */
  readonly confidence: number;
  readonly at: Date;
}

/** What happened to one alert on one channel. */
export interface Delivery {
  readonly sent: boolean;
  readonly channel: string;
  readonly detail: string;
}

/** The text a person reads, whatever the channel. */
export function describeAlert(alert: Alert): string {
  const time = alert.at.toTimeString().slice(0, 8);
  return `🚨 Persoană detectată: ${alert.cameraName} (${alert.zone}), ${Math.round(alert.confidence * 100)}%, ${time}`;
}
