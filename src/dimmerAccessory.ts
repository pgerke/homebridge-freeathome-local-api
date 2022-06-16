import {
  CharacteristicSetHandler,
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import { FreeAtHomeHomebridgePlatform } from "./platform";
import { DefaultDebounce, EmptyGuid } from "./util";
import { debounce } from "debounce";

/** A dimming actuator accessory.*/
export class DimmerAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private stateOn: boolean;
  private stateBrightness: number;

  private readonly setOn: CharacteristicSetHandler = debounce(
    (value: CharacteristicValue) => this.setOnDebounced(value),
    DefaultDebounce
  );
  private readonly setBrightness: CharacteristicSetHandler = debounce(
    (value: CharacteristicValue) => this.setBrightnessDebounced(value),
    DefaultDebounce
  );

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
      (this.stateOn
        ? this.accessory.context.channel.outputs?.odp0001.value
        : this.accessory.context.channel.inputs?.idp0002.value) ?? "0"
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

  private async setOnDebounced(value: CharacteristicValue): Promise<void> {
    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Dimmer Accessory ${
        this.serialNumber
      }) set characteristic On -> ${value.toString()}`
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
      await this.setBrightnessDebounced(this.stateBrightness);
  }

  private async setBrightnessDebounced(
    value: CharacteristicValue
  ): Promise<void> {
    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Dimmer Accessory ${
        this.serialNumber
      }) set characteristic Brightness -> ${value.toString()}`
    );

    // set data point at SysAP
    await this.platform.sysap.setDatapoint(
      EmptyGuid,
      this.accessory.context.deviceSerial,
      this.accessory.context.channelId,
      "idp0002",
      value.toString()
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
