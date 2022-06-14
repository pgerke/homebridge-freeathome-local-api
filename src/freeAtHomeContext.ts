import {
  Channel,
  Device,
  isChannel,
  isDevice,
  Logger,
} from "freeathome-local-api-client";
import {
  PlatformAccessory,
  UnknownContext,
} from "homebridge/lib/platformAccessory";

/** Describes the context of a free&#64;home accessory. */
export interface FreeAtHomeContext {
  channel: Channel;
  channelId: string;
  deviceSerial: string;
  device: Device;
}

/**
 * Determines whether the specified accessory is a free&#64;home accessory.
 * @param accessory The accessory to be tested
 * @param logger {Logger} The logger instance to be used.
 * @returns {boolean} A value indicating whether the specified object is a free&#64;home accessory.
 */
export function isFreeAtHomeAccessory(
  accessory: PlatformAccessory<UnknownContext>,
  logger: Logger
): accessory is PlatformAccessory<FreeAtHomeContext> {
  const keys = Object.keys(accessory.context);
  const hasKeys =
    keys.includes("device") &&
    keys.includes("deviceSerial") &&
    keys.includes("channel") &&
    keys.includes("channelId");

  return (
    hasKeys &&
    isChannel(accessory.context.channel, logger) &&
    isDevice(accessory.context.device, logger)
  );
}
