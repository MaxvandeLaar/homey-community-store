import SimpleClass = require("./SimpleClass");
import Driver = require("./Driver");
import Image = require("./Image");
import DiscoveryResult = require("./DiscoveryResult");

export = Device;

/**
 * The Device class is a representation of a device paired in Homey.
 * This class should be extended and exported from `device.js`, or any custom class as returned in {@link Driver#onMapDeviceClass}.
 * Methods prefixed with `on` are meant to be overriden.
 * It is not allowed to overwrite the constructor.
 * @tutorial Drivers
 * @hideconstructor
 */
declare class Device extends SimpleClass {
    constructor(deviceData: any, driver: any, client: any);
    getAppId(): any;
    /**
     * Calls the callback when the Device is ready ({@link Device#onInit} has been run).
     */
    ready(callback: () => void): void;
    /**
     * Get the device's driver
     * @returns {Driver} The device's driver instance
     */
    getDriver(): Driver;
    /**
     * Get the device's state (capability values)
     * @returns {Object} The device's state object
     */
    getState(): any;
    /**
     * Get the device's data object
     * @returns {Object} The device's data object
     */
    getData(): any;
    /**
     * Set a warning message for this device, to be shown to the user
     * @param message {string} - Custom warning message, or `null` to unset the warning
     * @returns {Promise<any>}
     */
    setWarning(message: string): Promise<any>;
    /**
     * Unset the warning message for this device
     * @returns {Promise<any>}
     */
    unsetWarning(): Promise<any>;
    /**
     * Get the device's availability
     * @returns {boolean} If the device is marked as available
     */
    getAvailable(): boolean;
    /**
     * Set the device's availability to true
     * @returns {Promise<any>}
     */
    setAvailable(): Promise<any>;
    /**
     * Set the device's availability to false, with a message
     * @param message {string} - Custom unavailable message, or `null` for default
     * @returns {Promise<any>}
     */
    setUnavailable(message: string): Promise<any>;
    /**
     * Get a device's setting value
     * @param {String} key
     * @returns {*} The value, or `null` when unknown
     */
    getSetting(key: string): any;
    /**
     * Get the device's settings object
     * @returns {Object} The device's settings object
     * @tutorial Drivers-Settings
     */
    getSettings(): any;
    /**
     * Set the device's settings object. The `newSettings` object may contain a subset of all settings.
     * Note that the {@link Device#onSettings} method will not be called when the settings are changed programmatically.
     * @param {Object} settings - A settings object
     * @returns {Promise<void>}
     * @tutorial Drivers-Settings
     */
    setSettings(settings: any): Promise<void>;
    /**
     * Get an array of capabilities
     * @returns {Array} The device's capabilities array
     */
    getCapabilities(): any[];
    /**
     * Returns true if the device has a certain capability
     * @param {string} capabilityId
     * @returns {boolean}
     */
    hasCapability(capabilityId: string): boolean;
    /**
     * Add a capability to this device.
     * Note: this is an expensive method so use it only when needed.
     * @since 3.0.0
     * @param capabilityId
     */
    addCapability(capabilityId: any): Promise<void>;
    /**
     * Removes a capability from this device.
     * Any Flow that depends on this capability will become broken.
     * Note: this is an expensive method so use it only when needed.
     * @since 3.0.0
     * @param capabilityId
     */
    removeCapability(capabilityId: any): Promise<void>;
    /**
     * Get the device's name
     * @returns {string} The device's name
     */
    getName(): string;
    /**
     * Get the device's class
     * @returns {string} The device's class
     */
    getClass(): string;
    /**
     * Set the device's class
     * Any Flow that depends on this class will become broken.
     * @since 3.0.0
     * @param {string} class
     * @returns {void}
     */
    setClass(c: any): void;
    /**
     * Get the device's energy object
     * @since 3.0.0
     * @returns {object} The device's energy info object
     */
    getEnergy(): any;
    /**
     * Set the device's energy object
     * @since 3.0.0
     * @param {Object} energy
     */
    setEnergy(energy: any): Promise<void>;
    /**
     * Get a device's capability value
     * @param {string} capabilityId
     * @returns {*} The value, or `null` when unknown
     */
    getCapabilityValue(capabilityId: string): any;
    /**
     * Set a device's capability value
     * @param {string} capabilityId
     * @param {*} value
     * @returns {Promise<void>}
     */
    setCapabilityValue(capabilityId: string, value: any): Promise<void>;
    /**
     * Get a device's capability options.
     * @param {string} capabilityId
     * @since 3.0.0
     * @returns {Object}
     */
    getCapabilityOptions(capabilityId: string): any;
    /**
     * Set a device's capability options.
     * Note: this is an expensive method so use it only when needed.
     * @param {string} capabilityId
     * @since 3.0.0
     * @param {Object} options
     */
    setCapabilityOptions(capabilityId: string, options: any): Promise<void>;
    /**
     * Register a listener for a capability change event.
     * This is invoked when a device's state change is requested.
     * @param {string} capabilityId
     * @param {Function} listener
     * @param {Mixed} listener.value - The new value
     * @param {Object} listener.opts - An object with optional properties, e.g. `{ duration: 300 }`
     * @example
     * this.registerCapabilityListener('dim', ( value, opts ) => {
     *   this.log('value', value);
     *   this.log('opts', opts);
     *   return Promise.resolve();
     * });
     */
    registerCapabilityListener(capabilityId: string, listener: Function): void;
    /**
     * Register a listener for multiple capability change events. The callback is debounced with `timeout`
     * This is invoked when a device's state change is requested.
     * @param {string[]} capabilityIds
     * @param {Function} listener
     * @param {Mixed} listener.capabilityValues - An object with the changed capability values, e.g. `{ dim: 0.5 }`
     * @param {Object} listener.capabilityOptions - An object with optional properties, per capability, e.g. `{ dim: { duration: 300 } }`
     * @param {number} timeout - The debounce timeout
     * @example
     * this.registerMultipleCapabilityListener([ 'dim', 'light_hue', 'light_saturation' ], ( capabilityValues, capabilityOptions ) => {
     *   this.log('capabilityValues', capabilityValues);
     *   this.log('capabilityOptions', capabilityOptions);
     *   return Promise.resolve();
     * }, 500);
     */
    registerMultipleCapabilityListener(capabilityIds: string[], listener: Function, timeout: number): void;
    /**
     * Trigger a capability listener programmatically.
     * @param {string} capabilityId
     * @param {Mixed} value
     * @param {Object} opts
     * @returns {Promise<any>}
     */
    triggerCapabilityListener(capabilityId: string, value: any, opts?: any): Promise<any>;
    /**
     * Get the entire store
     * @returns {Object}
     */
    getStore(): any;
    /**
     * Get all store keys.
     * @returns {String[]}
     */
    getStoreKeys(): string[];
    /**
     * Get a store value.
     * @param {string} key
     * @returns {*} value
     */
    getStoreValue(key: string): any;
    /**
     * Set a store value.
     * @param {string} key
     * @param {*} value
     * @returns {Promise<Object>} - The new store
     */
    setStoreValue(key: string, value: any): Promise<any>;
    /**
     * Unset a store value.
     * @param {string} key
     * @returns {Promise<Object>} - The new store
     */
    unsetStoreValue(key: string): Promise<any>;
    /**
     * Set this device's album art
     * @param {Image} image
     * @returns {Promise<any>}
     */
    setAlbumArtImage(image: Image): Promise<any>;
    /**
     * Set a device's camera image
     * @param {string} id Unique ID of the image (e.g. `front`)
     * @param {string} title Title of the image (e.g. `Front`)
     * @param {Image} image
     * @returns {Promise<any>}
     */
    setCameraImage(id: string, title: string, image: Image): Promise<any>;
    destroy(): void;
    /**
     * This method is called when the user updates the device's settings.
     * @param {Object} oldSettings The old settings object
     * @param {Object} newSettings The new settings object
     * @param {Array} changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     * @tutorial Drivers-Settings
     */
    onSettings(oldSettings: any, newSettings: any, changedKeys: any[]): Promise<string | void>;
    /**
     * This method is called when the user updates the device's name. Use this to synchronize the name to the device or bridge.
     * @param {string} name The new name
     */
    onRenamed(newName: any): void;
    /**
     * This method is called when the user deleted the device.
     */
    onDeleted(): void;
    /**
     * This method is called when the user adds the device, called just after pairing.
     */
    onAdded(): void;
    /**
     * This method is called when the device is loaded, and properties such as name, capabilities and state are available.
     */
    onInit(): void;
    /**
     * This method is called when a device has been discovered. Overload this method, and return a truthy value when the result belongs to the current device or falsy when it doesn't.
     * By default, the method will match on a device's data.id property.
     * @param {DiscoveryResult} discoveryResult
     */
    onDiscoveryResult(discoveryResult: DiscoveryResult): boolean;
    /**
     * This method is called when the device is found for the first time. Overload this method to create a connection to the device. Throwing here will make the device unavailable with the error message.
     * @param {DiscoveryResult} discoveryResult
     */
    onDiscoveryAvailable(discoveryResult: DiscoveryResult): void;
    /**
     * This method is called when the device's address has changed.
     * @param {DiscoveryResult} discoveryResult
     */
    onDiscoveryAddressChanged(discoveryResult: DiscoveryResult): void;
    /**
     * This method is called when the device has been found again.
     * @param {DiscoveryResult} discoveryResult
     */
    onDiscoveryLastSeenChanged(discoveryResult: DiscoveryResult): void;
}
