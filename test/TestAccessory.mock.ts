import { PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeHomebridgePlatform } from "../src/platform";
import { FreeAtHomeAccessory } from "./../src/freeAtHomeAccessory";
import { FreeAtHomeContext } from "./../src/freeAtHomeContext";

export class TestAccessory extends FreeAtHomeAccessory {
  readonly service: Service;
  constructor(
    readonly platform: FreeAtHomeHomebridgePlatform,
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
