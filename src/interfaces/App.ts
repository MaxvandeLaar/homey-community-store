export interface AppInfo {
  repo: string;
  id: string;
  name: {
    en: string;
  },
  version: string;
  icon: string;
  compatibility: string;
  sdk: number;
  brandColor?: string;
  description: {
    en: string;
  };
  tags: {
    en: string[];
  };
  category: string[];
  images: {
    large: string;
    small: string;
  },
  author: {
    name: string;
  };
  contributors: {
    developers: {name: string;}[];
    translators: {name: string;}[];
  };
  source: string;
  homepage: string;
  support: string;
  flow: {
    triggers: {}[];
    condition: {}[];
    actions: {}[];
  }
}
