import { CharacteristicValue, PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import { FreeAtHomeHomebridgePlatform } from "./platform";
import { EmptyGuid, convertToString } from "./util";

/** A dimming actuator accessory.*/
export class DimmerAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private stateOn: boolean;
  private stateBrightness: number;

  /**
   * Constructs a new dimming actuator accessory instance.
   * @param platform The free&#64;home Homebridge platform controlling the accessory
   * @param accessory The platform accessory.
   */
  constructor(
    readonly platform: FreeAtHomeHomebridgePlatform,
    readonly accessory: PlatformAccessory<FreeAtHomeContext>
  ) {
    super(platform, accessory);

    // set initial state
    this.stateOn = !!parseInt(
      this.accessory.context.channel.outputs?.odp0000.value ?? "0"
    );
    this.stateBrightness = parseInt(
      this.accessory.context.channel.outputs?.odp0001.value ??
        this.accessory.context.channel.inputs?.idp0002.value ??
        "0"
    );

    // get the Lightbulb service if it exists, otherwise create a new service instance
    this.service =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(() => this.stateOn);

    // register handlers for the Brightness Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))
      .onGet(() => this.stateBrightness);
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    // avoid unncessary updates or update cache
    if (value === this.stateOn) return;
    else this.stateOn = value as boolean;

    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Dimmer Accessory ${
        this.serialNumber
      }) set characteristic On -> ${convertToString(value)}`
    );

    // set data point at SysAP
    await this.platform.sysap.setDatapoint(
      EmptyGuid,
      this.accessory.context.deviceSerial,
      this.accessory.context.channelId,
      "idp0000",
      value ? "1" : "0"
    );

    // restore previous brightness
    if (value && this.stateBrightness)
      await this.setBrightness(this.stateBrightness);
  }

  private async setBrightness(value: CharacteristicValue): Promise<void> {
    // avoid unncessary updates or update cache
    if (value === this.stateBrightness) return;
    else this.stateBrightness = value as number;

    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Dimmer Accessory ${
        this.serialNumber
      }) set characteristic Brightness -> ${convertToString(value)}`
    );

    // set data point at SysAP
    await this.platform.sysap.setDatapoint(
      EmptyGuid,
      this.accessory.context.deviceSerial,
      this.accessory.context.channelId,
      "idp0002",
      convertToString(value)
    );
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    // ignore unknown data points
    switch (datapoint) {
      case "odp0000":
        this.stateOn = !!parseInt(value);
        // do the update
        this.doUpdateDatapoint(
          "Dimmer Accessory",
          this.service,
          this.platform.Characteristic.On,
          this.stateOn
        );
        return;
      case "odp0001":
        // Do NOT set brightness to 0, otherwise when turning the dimmer back on, brightness will be 100%.
        if (value === "0") return;

        this.stateBrightness = parseInt(value);
        this.doUpdateDatapoint(
          "Dimmer Accessory",
          this.service,
          this.platform.Characteristic.Brightness,
          this.stateBrightness
        );
        return;
      default:
        return;
    }
  }
}
