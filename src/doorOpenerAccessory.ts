import { CharacteristicValue, PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import { FreeAtHomeHomebridgePlatform } from "./platform";
import { EmptyGuid, convertToString } from "./util";

/** A door opener accessory.*/
export class DoorOpenerAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private stateActive: boolean;

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

    // set initial state
    this.stateActive = !!parseInt(
      this.accessory.context.channel.outputs?.odp0000.value ?? "0"
    );

    // get the LockMechanism service if it exists, otherwise create a new service instance
    this.service =
      this.accessory.getService(this.platform.Service.LockMechanism) ||
      this.accessory.addService(this.platform.Service.LockMechanism);

    // register handlers for the current lock state Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.LockCurrentState)
      .onGet(() =>
        this.stateActive
          ? this.platform.Characteristic.LockCurrentState.UNSECURED
          : this.platform.Characteristic.LockCurrentState.SECURED
      );

    // register handlers for the current lock state Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.LockTargetState)
      .onSet(this.setLockTargetState.bind(this))
      .onGet(() =>
        this.stateActive
          ? this.platform.Characteristic.LockTargetState.UNSECURED
          : this.platform.Characteristic.LockTargetState.SECURED
      );
  }

  private async setLockTargetState(value: CharacteristicValue): Promise<void> {
    // avoid unncessary updates or update cache
    const booleanTargetState = !(value as number);
    if (booleanTargetState === this.stateActive) return;
    else this.stateActive = booleanTargetState;

    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Door Opener ${
        this.serialNumber
      }) set characteristic LockTargetState -> ${convertToString(value)}`
    );

    // set data point at SysAP
    try {
      await this.platform.sysap.setDatapoint(
        EmptyGuid,
        this.accessory.context.deviceSerial,
        this.accessory.context.channelId,
        "idp0000",
        booleanTargetState ? "1" : "0"
      );
    } catch (error) {
      // Reset to previous state and log error
      this.stateActive = !this.stateActive;
      this.platform.log.error(
        `${this.accessory.displayName} (Door Opener ${
          this.serialNumber
        }) failed to set characteristic LockTargetState -> ${convertToString(
          value
        )}. Is the door opener configured in free@home?`
      );
    }
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    // ignore unknown data points
    if (datapoint !== "odp0000") return;

    // do the update
    this.stateActive = !!parseInt(value);
    this.doUpdateDatapoint(
      "Door Opener",
      this.service,
      this.platform.Characteristic.LockCurrentState,
      this.stateActive
        ? this.platform.Characteristic.LockCurrentState.UNSECURED
        : this.platform.Characteristic.LockCurrentState.SECURED
    );
    this.doUpdateDatapoint(
      "Door Opener",
      this.service,
      this.platform.Characteristic.LockTargetState,
      this.stateActive
        ? this.platform.Characteristic.LockTargetState.UNSECURED
        : this.platform.Characteristic.LockTargetState.SECURED
    );
  }
}
