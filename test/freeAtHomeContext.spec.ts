import { Channel, Device, Logger } from "freeathome-local-api-client";
import {
  PlatformAccessory,
  UnknownContext,
} from "homebridge/lib/platformAccessory";
import { isFreeAtHomeAccessory } from "./../src/freeAtHomeContext";
import { EmptyGuid } from "./../src/util";

const channel: Channel = {};
const device: Device = {};
const logger: Logger = {
  debug: jasmine.createSpy(),
  error: jasmine.createSpy(),
  warn: jasmine.createSpy(),
  log: jasmine.createSpy(),
};

describe("FreeAtHomeContext", () => {
  it("should reject context if device serial is missing", () => {
    const accessory: PlatformAccessory<UnknownContext> = new PlatformAccessory(
      "Test Accessory",
      EmptyGuid
    );
    accessory.context = {
      channel: channel,
      channelId: "ch1234",
      device: device,
    };
    expect(isFreeAtHomeAccessory(accessory, logger)).toBeFalse();
  });

  it("should reject context if channel ID is missing", () => {
    const accessory: PlatformAccessory<UnknownContext> = new PlatformAccessory(
      "Test Accessory",
      EmptyGuid
    );
    accessory.context = {
      channel: channel,
      device: device,
      deviceSerial: "ABB7xxxxxxxx",
    };
    expect(isFreeAtHomeAccessory(accessory, logger)).toBeFalse();
  });

  it("should reject context if channel is missing", () => {
    const accessory: PlatformAccessory<UnknownContext> = new PlatformAccessory(
      "Test Accessory",
      EmptyGuid
    );
    accessory.context = {
      channelId: "ch1234",
      device: device,
      deviceSerial: "ABB7xxxxxxxx",
    };
    expect(isFreeAtHomeAccessory(accessory, logger)).toBeFalse();
  });

  it("should reject context if channel is missing", () => {
    const accessory: PlatformAccessory<UnknownContext> = new PlatformAccessory(
      "Test Accessory",
      EmptyGuid
    );
    accessory.context = {
      channel: channel,
      channelId: "ch1234",
      deviceSerial: "ABB7xxxxxxxx",
    };
    expect(isFreeAtHomeAccessory(accessory, logger)).toBeFalse();
  });

  it("should accept context if all properties are present", () => {
    const accessory: PlatformAccessory<UnknownContext> = new PlatformAccessory(
      "Test Accessory",
      EmptyGuid
    );
    accessory.context = {
      channel: channel,
      channelId: "ch1234",
      device: device,
      deviceSerial: "ABB7xxxxxxxx",
    };
    expect(isFreeAtHomeAccessory(accessory, logger)).toBeTrue();
  });
});
