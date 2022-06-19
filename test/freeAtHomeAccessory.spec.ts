import { Channel, Device } from "freeathome-local-api-client";
import { PlatformAccessory } from "homebridge/lib/platformAccessory";
import { FreeAtHomeContext } from "../src/freeAtHomeContext";
import { EmptyGuid } from "../src/util";
import { MockFreeAtHomeHomebridgePlatform } from "./platform.mock";
import { TestAccessory } from "./TestAccessory.mock";

describe("free@home Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {};
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = new PlatformAccessory("Test Accessory", EmptyGuid);
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
    const serviceSpy = spyOn(accessory.service, "updateCharacteristic");
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
