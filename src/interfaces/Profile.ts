import {Homeys} from "./Homey";

export interface Profile {
  __athom_api_type: string;
  language: string;
  roleIds: string[];
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  devices: Devices;
  avatar: {
    small: string;
    medium: string;
    large: string;
  },
  subscriptions: {
    homey_plus_athom: {
      expiresAt: number;
      startedAt: number;
      autoRenew: boolean;
    }
  },
  roles: Roles;
  fullname: string;
  homeys: Homeys
}

export interface Device {
  __athom_api_type: string;
  devMode: boolean;
  created: string;
  updated: string;
  _id: string;
  platform: string;
  token: string;
  publicKey: string;
  name: string;
  appVersion: string;
  osVersion: string;
  devmode: undefined;
}

export type Devices = Device[];

export interface Role {
  __athom_api_type: string;
  _id: string;
  name: string;
  scopes: string[]
}

export type Roles = Role[];
