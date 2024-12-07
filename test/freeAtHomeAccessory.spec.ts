import { Channel, Device } from "freeathome-local-api-client";
import {
  Characteristic,
  CharacteristicValue,
  Nullable,
  PlatformAccessory,
  Service,
  WithUUID,
} from "homebridge";
import { FreeAtHomeContext } from "../src/freeAtHomeContext.js";
import {
  createPlatformAccessory,
  MockFreeAtHomeHomebridgePlatform,
} from "./platform.mock.js";
import { TestAccessory } from "./TestAccessory.mock.js";

describe("free@home Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {};
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = createPlatformAccessory("Test Accessory");
    platformAccessory.context = {
      channel: channel,
      channelId: "ch1234",
      device: device,
      deviceSerial: "ABB7xxxxxxxx",
    };
  });
  afterEach(() => {
    platform.resetLoggerCalls();
  });

  it("should be created", () => {
    const accessory = new TestAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const model = accessory.accessory
      .getService(platform.Service.AccessoryInformation)
      ?.getCharacteristic(platform.Characteristic.Model).value;
    expect(model).toBeDefined();
    expect(model).toEqual("Unknown Model");
  });

  it("should be created with model", () => {
    device.displayName = "Test";
    const accessory = new TestAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const model = accessory.accessory
      .getService(platform.Service.AccessoryInformation)
      ?.getCharacteristic(platform.Characteristic.Model).value;
    expect(model).toBeDefined();
    expect(model).toEqual("Test");
  });

  it("should asynchronously update the data point", () => {
    const accessory = new TestAccessory(platform, platformAccessory);
    const serviceSpy = spyOn(
      accessory.service as {
        updateCharacteristic: (
          name: string | WithUUID<new () => Characteristic>,
          value: Nullable<CharacteristicValue>
        ) => Service;
      },
      "updateCharacteristic"
    );
    accessory.updateDatapoint("Test", "New Serial");
    expect(serviceSpy).toHaveBeenCalledWith(
      accessory.platform.Characteristic.SerialNumber,
      "New Serial"
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(accessory.platform.log.info).toHaveBeenCalledWith(
      "Test Accessory (Test ABB7xxxxxxxx (ch1234)) updated characteristic SerialNumber -> New Serial"
    );
  });

  it("should tolerate if AccessoryInformation service is not available", () => {
    spyOn(platformAccessory, "getService").and.returnValue(undefined);
    const accessory = new TestAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
  });
});
