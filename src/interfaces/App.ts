export interface AppInfo {
  repo: string;
  id: string;
  locales: {[key: string]: {[key: string]: any}};
  name: { [key: string]: string };
  version: string;
  icon: string;
  compatibility: string;
  sdk: number;
  brandColor?: string;
  description: {[key: string]: string};
  tags: {[key: string]: string[]};
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
  progress?: {
    step?: number;
    totalSteps?: number;
    message?: string;
  };
  rawUrl: string;
  readMe?: string;
  drivers: {
    id: string;
    name: {
      en: string;
    },
    mobile: {
      id: string;
      capabilities: string[];
      options?: {
        showTitle: boolean;
        icons: {};
      }
    }[];
    zwave?: {
      manufacturerId: number[];
      productTypeId: number;
      productId: number[];
      includeSecure: boolean;
      productDocumentation: string;
      pid: number;
      imageRemotePath: string;
      learnmode: {
        image: string;
        instruction: {
          en: string;
        }
      },
      unlearnmode: {
        image: string;
        instruction: {
          en: string;
        }
      },
      associationGroups: number[];
      defaultConfiguration: {
        id: number;
        size: number;
        value: number;
      }[]
    },
    class: string;
    energy?: {
      batteries?: string[];
    },
    capabilities: string[];
    capabilityOptions?: {};
    images: {
      large: string;
      small: string;
    },
    settings: {
      id: string;
      type: string;
      label: {
        en: string;
      };
      value: any;
      hint?: {
        en: string;
      }
      values?: any;
    }[];
  }[];
  flow: Flow;
}

export interface Flow {
  triggers?: {
    id: string;
    title: {
      en: string;
    }
  }[];
  conditions?: {
    id: string;
    title: {
      en: string;
    }
  }[];
  actions?: {
    id: string;
    title: {
      en: string;
    }
  }[];
}
