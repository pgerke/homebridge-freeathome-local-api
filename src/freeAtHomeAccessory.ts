import {
  Characteristic,
  CharacteristicValue,
  PlatformAccessory,
  Service,
  WithUUID,
} from "homebridge";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import { FreeAtHomeHomebridgePlatform } from "./platform";

/** The abstract base class for all free&#64;home accessories.*/
export abstract class FreeAtHomeAccessory {
  /** The serial number consisting of the free&#64;home device serial and the channel ID. */
  protected readonly serialNumber = `${this.accessory.context.deviceSerial} (${this.accessory.context.channelId})`;

  /**
   * Constructs a new free&#64;home accessory instance.
   * @param platform The free&#64;home Homebridge platform controlling the accessory
   * @param accessory The platform accessory.
   */
  constructor(
    protected readonly platform: FreeAtHomeHomebridgePlatform,
    protected readonly accessory: PlatformAccessory<FreeAtHomeContext>
  ) {
    // set accessory information
    this.accessory
      .getService(this.platform.Service.AccessoryInformation)
      ?.setCharacteristic(
        this.platform.Characteristic.Manufacturer,
        "BUSCH-JAEGER"
      )
      .setCharacteristic(
        this.platform.Characteristic.Model,
        accessory.context.device.displayName ?? "Unknown Model"
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
        this.serialNumber
      );
  }

  /**
   * Asynchonously updates accessory characteristics from a datapoint.
   * @param datapoint The updated data point.
   * @param value A string representing the new value.
   */
  public abstract updateDatapoint(datapoint: string, value: string): void;

  protected doUpdateDatapoint(
    acccessoryDisplayType: string,
    service: Service,
    characteristic: WithUUID<new () => Characteristic>,
    characteristicValue: CharacteristicValue
  ): void {
    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (${acccessoryDisplayType} ${
        this.serialNumber
      }) updated characteristic ${
        characteristic.name
      } -> ${characteristicValue.toString()}`
    );

    // asynchoronously update the characteristic
    service.updateCharacteristic(characteristic, characteristicValue);
  }
}
