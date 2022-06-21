import { PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import { FreeAtHomeHomebridgePlatform } from "./platform";

/** A smoke detector accessory. */
export class SmokeDetectorAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private stateSmokeDetected: boolean;

  /**
   * Constructs a new smoke detector accessory instance.
   * @param platform The free&#64;home Homebridge platform controlling the accessory
   * @param accessory The platform accessory.
   */
  constructor(
    readonly platform: FreeAtHomeHomebridgePlatform,
    readonly accessory: PlatformAccessory<FreeAtHomeContext>
  ) {
    super(platform, accessory);

    // set initial state
    this.stateSmokeDetected = !!parseInt(
      this.accessory.context.channel.outputs?.odp0000.value ?? "0"
    );

    // get the SmokeSensor service if it exists, otherwise create a new service instance
    this.service =
      this.accessory.getService(this.platform.Service.SmokeSensor) ||
      this.accessory.addService(this.platform.Service.SmokeSensor);

    // register handlers for the smoke detected dharacteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.SmokeDetected)
      .onGet(() =>
        this.stateSmokeDetected
          ? this.platform.Characteristic.SmokeDetected.SMOKE_DETECTED
          : this.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
      );
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    // ignore unknown data points
    if (datapoint !== "odp0000") return;

    // do the update
    this.stateSmokeDetected = !!parseInt(value);
    this.doUpdateDatapoint(
      "Smoke Detector",
      this.service,
      this.platform.Characteristic.SmokeDetected,
      this.stateSmokeDetected
        ? this.platform.Characteristic.SmokeDetected.SMOKE_DETECTED
        : this.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
    );
  }
}
