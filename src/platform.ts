import {
  API,
  DynamicPlatformPlugin,
  Logger,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
  UnknownContext,
} from "homebridge";
import { PLATFORM_NAME, PLUGIN_NAME } from "./settings";
import {
  Channel,
  SystemAccessPoint,
  Logger as FreeAtHomeLogger,
  Configuration,
  WebSocketMessage,
} from "freeathome-local-api-client";
import { SwitchActuatorAccessory } from "./switchActuatorAccessory";
import { FreeAtHomeContext, isFreeAtHomeAccessory } from "./freeAtHomeContext";
import { experimentallySupportedFunctionIDs, FunctionID } from "./functionId";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { DimmerAccessory } from "./dimmerAccessory";
import { Subscription } from "rxjs";
import { RoomTemperatureControllerAccessory } from "./roomTemperatureControllerAccessory";
import { EmptyGuid } from "./util";
import { SmokeDetectorAccessory } from "./smokeDetectorAccessory";
import { MotionSensorAccessory } from "./motionSensorAccessory";
import { DoorOpenerAccessory } from "./doorOpenerAccessory";
import { ShutterActuatorAccessory } from "./shutterActuatorAccessory";

const DelayFactor = 200;

/** The free&#64;home Homebridge platform. */
export class FreeAtHomeHomebridgePlatform implements DynamicPlatformPlugin {
  /** The service reference */
  public readonly Service: typeof Service = this.api.hap.Service;
  /** The characteristic reference */
  public readonly Characteristic: typeof Characteristic =
    this.api.hap.Characteristic;
  /** The list of restored cached accessories */
  public readonly accessories: Array<PlatformAccessory<FreeAtHomeContext>> = [];
  private readonly removedAccessories: Array<
    PlatformAccessory<UnknownContext>
  > = [];
  /** The system access point */
  public readonly sysap: SystemAccessPoint;
  private readonly fahAccessories = new Map<string, FreeAtHomeAccessory>();
  private readonly fahLogger: FreeAtHomeLogger;
  private readonly webSocketSubscription: Subscription;
  private wsConnectionAttempt = 0;
  private readonly maxWsRetryCount: number;

  private get experimentalMode(): boolean {
    return this.config.experimental as boolean;
  }

  /**
   * Constructs a new free&#64;home Homebridge platform instance.
   * @param log {Logger} The logger instance.
   * @param config {PlatformConfig} The platform configuration.
   * @param api {API} The API instance.
   */
  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API
  ) {
    // set maximum reconnection attempt count
    this.maxWsRetryCount = (this.config.maxWsRetryCount as number) ?? 10;

    // Create a logger for the free&#64;home Local API Client
    this.fahLogger = {
      debug: (message?: unknown, ...optionalParams: unknown[]) =>
        log.debug(<string>message, ...optionalParams),
      error: (message?: unknown, ...optionalParams: unknown[]) =>
        log.error(<string>message, ...optionalParams),
      log: (message?: unknown, ...optionalParams: unknown[]) =>
        log.info(<string>message, ...optionalParams),
      warn: (message?: unknown, ...optionalParams: unknown[]) =>
        log.warn(<string>message, ...optionalParams),
    };

    // Create a system access point instance
    this.sysap = new SystemAccessPoint(
      this.config.host as string,
      this.config.user as string,
      this.config.password as string,
      this.config.tlsEnabled as boolean,
      this.config.verboseErrors as boolean,
      this.fahLogger
    );

    // React to web socket events
    this.sysap.on("websocket-open", () => {
      this.wsConnectionAttempt = 0;
    });
    this.sysap.on("websocket-close", (code: number, reason: Buffer) => {
      if (code === 1000) return;

      this.log.warn(
        `Websocket to System Access Point was closed with code ${code.toString()}: ${reason.toString()}`
      );
      if (this.wsConnectionAttempt >= this.maxWsRetryCount) {
        this.log.error(
          "Maximum retry count exceeded. Will not try to reconnect to websocket again."
        );
        return;
      }

      const delay = DelayFactor * 2 ** this.wsConnectionAttempt++;
      this.log.info(
        `Attempting to reconnect in ${delay}ms [${this.wsConnectionAttempt}/${this.maxWsRetryCount}]`
      );
      setTimeout(
        () => this.sysap.connectWebSocket(this.config.tlsEnabled as boolean),
        delay
      );
    });

    // Subscribe to web socket messages
    this.webSocketSubscription = this.sysap
      .getWebSocketMessages()
      .subscribe((message: WebSocketMessage) =>
        this.processWebSocketMesage(message)
      );

    // Experimental mode
    if (this.experimentalMode) this.log.warn("Experimental Mode enabled!");

    this.log.debug("Finished initializing platform:", this.config.name);

    // When Homebridge has restored all cached accessories from disk we can start discovery of new accessories.
    this.api.on("didFinishLaunching", () => {
      log.debug("Executed didFinishLaunching callback");

      // Unregister removed accessories
      this.api.unregisterPlatformAccessories(
        PLUGIN_NAME,
        PLATFORM_NAME,
        this.removedAccessories
      );

      // run discovery
      this.discoverDevices()
        .then(() =>
          this.log.info(
            `Discovery completed: ${this.fahAccessories.size} accessories detected`
          )
        )
        .catch((error) => this.log.error("Device discovery failed", error));

      // Connect to system access point web socket
      this.sysap.connectWebSocket(this.config.tlsEnabled as boolean);
    });
    this.api.on("shutdown", () => {
      log.debug("Executed shutdown callback");
      this.webSocketSubscription.unsubscribe();
    });
  }

  /**
   * Configures the specified accessory.
   * @param accessory The accessory to be configured.
   * @description
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  public configureAccessory(accessory: PlatformAccessory) {
    // Remove cached non-free@home devices
    if (!isFreeAtHomeAccessory(accessory, this.fahLogger)) {
      this.removedAccessories.push(accessory);
      this.log.warn(
        "Removing accessory from cache (no free@home device):",
        accessory.displayName
      );
      return;
    }

    // Remove cached ignored devices
    if (
      this.isIgnoredChannel(
        accessory.context.deviceSerial,
        accessory.context.channelId
      )
    ) {
      this.removedAccessories.push(accessory);
      this.log.warn(
        "Removing accessory from cache (channel on ignore list):",
        accessory.displayName
      );
      return;
    }

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.log.info("Loading accessory from cache:", accessory.displayName);
    this.accessories.push(accessory);
  }

  /** Discovers the supported free&#64;home devices from the System Access Point. */
  private async discoverDevices(): Promise<void> {
    // Get the SysAP configuration
    const config: Configuration = await this.sysap.getConfiguration();

    // Enmumerate the devices
    Object.keys(config[EmptyGuid].devices).forEach((serial: string) => {
      // Filter unsupported (pseudo) devices like scenes or third party devices
      if (!serial.startsWith("ABB")) return;

      // Filter devices without channels
      const device = config[EmptyGuid].devices[serial];
      if (!device.channels) return;

      // Room and Floor may be defined either on device or on channel level.
      // Here we check if the location is defined on device level.
      const locationConfiguredOnDeviceLevel = !!device.floor && !!device.room;

      // Enumerate the channels
      Object.keys(device.channels).forEach((channelId: string) => {
        // We are enumerating the keys of the channels object. Neither the channels object nor the channelId can possibly be undefined.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const channel = device.channels![channelId];
        if (
          !this.isViableChannel(
            serial,
            channelId,
            channel,
            locationConfiguredOnDeviceLevel
          )
        )
          return;

        // Create or restore the accessory
        const uuid = this.api.hap.uuid.generate(`${serial}_${channelId}`);
        let accessory = this.accessories.find((a) => a.UUID === uuid);
        if (accessory) {
          // the accessory already exists
          this.log.info(
            "Restoring existing accessory from cache:",
            accessory.displayName
          );

          // Update context
          accessory.context.deviceSerial = serial;
          accessory.context.device = device;
          accessory.context.channel = channel;
          accessory.context.channelId = channelId;
          this.api.updatePlatformAccessories([accessory]);
          // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
          // remove platform accessories when no longer present
          // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
          // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        } else {
          // the accessory does not yet exist, so we need to create it
          this.log.info("Adding new accessory:", channel.displayName);
          // create a new accessory
          accessory = new this.api.platformAccessory<FreeAtHomeContext>(
            channel.displayName ?? uuid,
            uuid
          );
          accessory.context.deviceSerial = serial;
          accessory.context.device = device;
          accessory.context.channel = channel;
          accessory.context.channelId = channelId;
          // link the accessory to your platform
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
            accessory,
          ]);
        }

        // This check is used to apply the type guard so the accessory can be used as a free@home accesory without a cast.
        // Given that the accessory context is constructed in the previous lines, it is impossible for the type check to fail.
        // Consequently the branch can never be covered and is excluded from the coverage.
        /* istanbul ignore next */
        if (!isFreeAtHomeAccessory(accessory, this.fahLogger)) return;

        // create accessory
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.createAccessory(serial, channel.functionID!, channelId, accessory);
      });
    });
  }

  private isViableChannel(
    serial: string,
    channelId: string,
    channel: Channel,
    locationConfiguredOnDeviceLevel: boolean
  ): channel is Channel {
    // Filter unsupported channels
    if (
      !(
        channel.functionID &&
        Object.values<string>(FunctionID).includes(
          channel.functionID.toUpperCase()
        )
      )
    ) {
      this.log.debug(
        `Ignored ${serial} (${channelId}): FunctionID '${
          channel.functionID ?? "<UNDEFINED>"
        }' is not supported.`
      );
      return false;
    }

    // Filter unconfigured devices
    if (!locationConfiguredOnDeviceLevel && !(channel.floor && channel.room)) {
      this.log.debug(
        `Ignored ${serial} (${channelId}): Floor and room are not configured.`
      );
      return false;
    }

    // Filter ignored devices
    if (this.isIgnoredChannel(serial, channelId)) {
      this.log.debug(
        `Ignored ${serial} (${channelId}): Channel is listed on the ignore list.`
      );
      return false;
    }

    // Filter experimental devices
    if (
      !this.experimentalMode &&
      experimentallySupportedFunctionIDs.includes(
        channel.functionID.toUpperCase() as FunctionID
      )
    ) {
      return false;
    }

    return true;
  }
  private createAccessory(
    serial: string,
    functionID: string,
    channelId: string,
    accessory: PlatformAccessory<FreeAtHomeContext>
  ): void {
    switch (functionID.toUpperCase()) {
      case FunctionID.FID_DES_AUTOMATIC_DOOR_OPENER_ACTUATOR:
      case FunctionID.FID_SWITCH_ACTUATOR:
        this.fahAccessories.set(
          `${serial}_${channelId}`,
          new SwitchActuatorAccessory(this, accessory)
        );
        return;
      case FunctionID.FID_ROOM_TEMPERATURE_CONTROLLER_MASTER_WITHOUT_FAN:
        this.fahAccessories.set(
          `${serial}_${channelId}`,
          new RoomTemperatureControllerAccessory(this, accessory)
        );
        return;
      case FunctionID.FID_DIMMING_ACTUATOR:
      case FunctionID.FID_RGB_ACTUATOR:
      case FunctionID.FID_RGB_W_ACTUATOR:
        this.fahAccessories.set(
          `${serial}_${channelId}`,
          new DimmerAccessory(this, accessory)
        );
        return;
      case FunctionID.FID_SMOKE_DETECTOR:
        this.fahAccessories.set(
          `${serial}_${channelId}`,
          new SmokeDetectorAccessory(this, accessory)
        );
        return;
      case FunctionID.FID_MOVEMENT_DETECTOR:
        this.fahAccessories.set(
          `${serial}_${channelId}`,
          new MotionSensorAccessory(this, accessory)
        );
        return;
      case FunctionID.FID_DES_DOOR_OPENER_ACTUATOR:
        this.fahAccessories.set(
          `${serial}_${channelId}`,
          new DoorOpenerAccessory(this, accessory)
        );
        return;
      case FunctionID.FID_SHUTTER_ACTUATOR:
      case FunctionID.FID_BLIND_ACTUATOR:
      case FunctionID.FID_ATTIC_WINDOW_ACTUATOR:
      case FunctionID.FID_AWNING_ACTUATOR:
        this.fahAccessories.set(
          `${serial}_${channelId}`,
          new ShutterActuatorAccessory(this, accessory)
        );
        return;
      default:
        this.log.error(
          `${serial} (${channelId}): Cannot configure accessory for FunctionID '${functionID}'!`
        );
    }
  }

  private isIgnoredChannel(device: string, channel: string): boolean {
    if (!this.config.ignoredChannels) return false;

    return (this.config.ignoredChannels as Array<string>).some(
      (e) =>
        e.toUpperCase() === `${device.toUpperCase()}/*` ||
        e.toUpperCase() === `${device.toUpperCase()}/${channel.toUpperCase()}`
    );
  }

  private processWebSocketMesage(message: WebSocketMessage): void {
    // Get data point identifiers
    const datapoints = Object.keys(message[EmptyGuid].datapoints);

    datapoints.forEach((datapoint) => {
      // Ignore data points that have an unexpected format
      const match = datapoint.match(
        /^(ABB[a-z0-9]{9})\/(ch[\da-f]{4})\/(odp\d{4})$/i
      );
      if (!match) {
        this.log.debug(`Ignored datapoint ${datapoint}: Unexpected format`);
        return;
      }

      // Ignore the data point if we don't have an accessory for it or update the accessory
      this.fahAccessories
        .get(`${match[1]}_${match[2]}`)
        ?.updateDatapoint(match[3], message[EmptyGuid].datapoints[datapoint]);
    });
  }
}
