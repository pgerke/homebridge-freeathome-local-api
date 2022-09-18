import { PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import { FreeAtHomeHomebridgePlatform } from "./platform";

/** A door ringing sensor accessory */
export class DoorRingingSensorAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private stateBellRung = false;

  /**
   * Constructs a new door opener accessory instance.
   * @param platform The free&#64;home Homebridge platform controlling the accessory
   * @param accessory The platform accessory.
   */
  constructor(
    readonly platform: FreeAtHomeHomebridgePlatform,
    readonly accessory: PlatformAccessory<FreeAtHomeContext>
  ) {
    super(platform, accessory);
    // this.accessory.category = this.platform.api.hap.Categories.VIDEO_DOORBELL;

    // get the Doorbell service if it exists, otherwise create a new service instance
    this.service =
      this.accessory.getService(this.platform.Service.Doorbell) ||
      this.accessory.addService(this.platform.Service.Doorbell);

    // register handlers for the current programmable switch event Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
      .onGet(() => 0);

    this.accessory.on("identify", this.identify.bind(this));
  }

  private identify(): void {
    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Door Ringing Sensor ${this.serialNumber}) identify requested!`
    );

    this.service
      .getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
      .setValue(
        this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS
      );
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Door Ringing Sensor ${this.serialNumber}) was rung.`
    );
    this.service
      .getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
      .setValue(
        this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS
      );
    // this.accessory.c
    // this.service.getCharacteristic(this.platform.Characteristic.)
    // // ignore unknown data points
    // if (datapoint !== "odp0000") return;
    // this.doUpdateDatapoint(
    //   "Door Ringing Sensor",
    //   this.service,
    //   this.platform.Characteristic.ProgrammableSwitchEvent,
    //   this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS
    // );
  }
}
