import {
  CharacteristicSetHandler,
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import {
  defaultDebounce,
  emptyGuid,
  FreeAtHomeHomebridgePlatform,
} from "./platform";
import { debounce } from "debounce";

/** A dimming actuator accessory.*/
export class DimmerAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private stateOn: boolean;
  private stateBrightness: number;

  private readonly setOn: CharacteristicSetHandler = debounce(
    (value: CharacteristicValue) => this.setOnDebounced(value),
    defaultDebounce
  );
  private readonly setBrightness: CharacteristicSetHandler = debounce(
    (value: CharacteristicValue) => this.setBrightnessDebounced(value),
    defaultDebounce
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
      this.accessory.context.channel.outputs?.odp0001.value ?? "0"
    );

    // get the Lightbulb service if it exists, otherwise create a new service instance
    this.service =
      this.accessory.getService(this.platform.Service.Lightbulb) ||
      this.accessory.addService(this.platform.Service.Lightbulb);

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));

    // register handlers for the Brightness Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this))
      .onGet(this.getBrightness.bind(this));
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
      emptyGuid,
      this.accessory.context.deviceSerial,
      this.accessory.context.channelId,
      "idp0000",
      value ? "1" : "0"
    );
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
      emptyGuid,
      this.accessory.context.deviceSerial,
      this.accessory.context.channelId,
      "idp0002",
      value.toString()
    );
  }

  private getOn(): Promise<CharacteristicValue> {
    return Promise.resolve(this.stateOn);
  }

  private getBrightness(): Promise<CharacteristicValue> {
    return Promise.resolve(this.stateBrightness);
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    // ignore unknown data points
    let characteristic: "On" | "Brightness";
    let characteristicValue: CharacteristicValue;
    switch (datapoint) {
      case "odp0000":
        characteristic = "On";
        characteristicValue = !!parseInt(value);
        this.stateOn = characteristicValue;
        break;
      case "odp0001":
        characteristic = "Brightness";
        characteristicValue = parseInt(value);
        this.stateBrightness = characteristicValue;
        break;
      default:
        return;
    }

    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Dimmer Accessory ${
        this.serialNumber
      }) updated characteristic ${characteristic} -> ${characteristicValue.toString()}`
    );

    // asynchoronously update the characteristic
    this.service.updateCharacteristic(characteristic, characteristicValue);
  }
}
