export type GeoSuccess = {
  ok: true;
  label: string;
  latitude: number;
  longitude: number;
  message: string;
};

export type GeoFailure = {
  ok: false;
  message: string;
};

export type GeoResult = GeoSuccess | GeoFailure;

export type MarkerData = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

export type MarkerRecord = MarkerData & {
  instance: any;
};
