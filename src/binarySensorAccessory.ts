import { CharacteristicValue, PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import { emptyGuid, FreeAtHomeHomebridgePlatform } from "./platform";

/**
 * A binary sensor accessory.
 * @description
 * A binary sensor can be used to control more or less any that free&#64;home device
 * that has a binary on/off power state exposed on data point 0000 like, for example,
 * binary switches or dimmers.
 */
export class BinarySensorAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;

  /**
   * Constructs a new binary sensor accessory instance.
   * @param platform The free&#64;home Homebridge platform controlling the accessory
   * @param accessory The platform accessory.
   */
  constructor(
    readonly platform: FreeAtHomeHomebridgePlatform,
    readonly accessory: PlatformAccessory<FreeAtHomeContext>
  ) {
    super(platform, accessory);

    // get the Switch service if it exists, otherwise create a new service instance
    this.service =
      this.accessory.getService(this.platform.Service.Switch) ||
      this.accessory.addService(this.platform.Service.Switch);

    // register handlers for the On/Off Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))
      .onGet(this.getOn.bind(this));
  }

  private async setOn(value: CharacteristicValue): Promise<void> {
    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Binary Sensor ${
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

  private async getOn(): Promise<CharacteristicValue> {
    // get data point from SysAP
    const response = await this.platform.sysap.getDatapoint(
      emptyGuid,
      this.accessory.context.deviceSerial,
      this.accessory.context.channelId,
      "odp0000"
    );

    // parse value
    const value = !!parseInt(response[emptyGuid].values[0]);

    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Binary Sensor ${
        this.serialNumber
      }) get characteristic On -> ${value.toString()}`
    );

    return value;
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    // ignore unknown data points
    if (datapoint !== "odp0000") return;

    // parse value
    const characteristicValue = !!parseInt(value);

    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Binary Sensor ${
        this.serialNumber
      }) updated characteristic On -> ${characteristicValue.toString()}`
    );

    // asynchoronously update the characteristic
    this.service.updateCharacteristic(
      this.platform.Characteristic.On,
      characteristicValue
    );
  }
}
