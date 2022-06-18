import { Channel, Device } from "freeathome-local-api-client";
import { Service } from "homebridge";
import { PlatformAccessory } from "homebridge/lib/platformAccessory";
import { FreeAtHomeAccessory } from "../src/freeAtHomeAccessory";
import { FreeAtHomeContext } from "../src/freeAtHomeContext";
import { EmptyGuid } from "../src/util";
import { MockFreeAtHomeHomebridgePlatform } from "./platform.mock";

class TestAccessory extends FreeAtHomeAccessory {
  readonly service: Service;
  constructor(
    readonly platform: MockFreeAtHomeHomebridgePlatform,
    readonly accessory: PlatformAccessory<FreeAtHomeContext>
  ) {
    super(platform, accessory);

    this.service = this.service =
      this.accessory.getService(this.platform.Service.Diagnostics) ||
      this.accessory.addService(this.platform.Service.Diagnostics);
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    this.doUpdateDatapoint(
      datapoint,
      this.service,
      this.platform.Characteristic.SerialNumber,
      value
    );
  }
}

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
