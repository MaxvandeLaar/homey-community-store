export interface HomeyApp {
  channel: string;
  id: string;
  version: string;
}

export interface HomeyUser {
  userId: string;
  role: string;
  user: undefined;
}

export interface Homey {
  __athom_api_type: string;
  _id: string;
  name: string;
  apps: HomeyApp[];
  users: HomeyUser[];
  geolocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  }
  ipExternal: string;
  ipInternal: string;
  language: string;
  softwareVersion: string;
  state: string;
  stateSince: string;
  mobileAppVersionSupported: string;
  apiVersion: number;
  remoteUrl: string;
  localUrl: string;
  localUrlSecure: string;
  id: string;
  role: string;
}

export type Homeys = Homey[];
