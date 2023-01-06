import {
  SystemAccessPoint,
  WebSocketMessage,
  Logger as FahLogger,
  Configuration,
} from "freeathome-local-api-client";
import { Logger, PlatformConfig } from "homebridge";
import { HomebridgeAPI } from "homebridge/lib/api";
import { PlatformAccessory } from "homebridge/lib/platformAccessory";
import { Subject, Subscription } from "rxjs";
import { FreeAtHomeAccessory } from "../src/freeAtHomeAccessory";
import {
  FreeAtHomeContext,
  isFreeAtHomeAccessory,
} from "../src/freeAtHomeContext";
import { FreeAtHomeHomebridgePlatform } from "../src/platform";
import { SwitchActuatorAccessory } from "../src/switchActuatorAccessory";
import { AccessoryType } from "../src/typeMappings";
import { EmptyGuid } from "../src/util";
import { TestAccessory } from "./TestAccessory.mock";

const configuration: Configuration = {
  "00000000-0000-0000-0000-000000000000": {
    sysapName: "Gerke",
    devices: {
      EXCLUDED0001: {
        floor: "1",
        room: "1",
        channels: {
          ch0001: {
            functionID: "7d",
          },
        },
      },
      FFFF48000001: {},
      ABB700000000: {},
      ABB700000001: {
        channels: {
          ch0000: {},
          ch0001: {
            functionID: "never",
          },
          ch0002: {
            functionID: "7",
          },
          ch0003: {
            functionID: "7",
            floor: "1",
            room: "1",
          },
          ch0004: {
            displayName: "Dimmer",
            functionID: "12",
            floor: "1",
            room: "1",
          },
        },
      },
      ABB700000002: {
        floor: "1",
        room: "1",
        channels: {
          ch0000: {
            functionID: "23",
          },
          ch0001: {
            functionID: "20",
          },
          ch0002: {
            functionID: "7D",
          },
          ch0003: {
            functionID: "11",
          },
          ch0004: {
            functionID: "1a",
          },
          ch0005: {
            functionID: "1a",
          },
        },
      },
      ABB700000003: {
        channels: {
          ch0003: {
            functionID: "7",
            floor: "1",
            room: "1",
          },
          ch0004: {
            displayName: "Dimmer",
            functionID: "12",
            floor: "1",
            room: "1",
          },
          ch0005: {
            functionID: "9",
          },
        },
      },
      ABB700000004: {
        floor: "1",
        room: "1",
        channels: {
          ch0005: {
            functionID: "9",
          },
        },
      },
      ABB700000005: {
        floor: "1",
        room: "1",
        channels: {
          ch0001: {
            functionID: "7",
          },
          ch0002: {
            functionID: "4800",
          },
        },
      },
      E11000000001: {
        floor: "1",
        room: "1",
        channels: {
          ch0001: {
            functionID: "7d",
          },
        },
      },
    },
    floorplan: {
      floors: {},
    },
    users: {},
  },
};

describe("free@home Homebridge Platform", () => {
  let api: HomebridgeAPI;
  let config: PlatformConfig;
  let logger: Logger;

  beforeEach(() => {
    api = new HomebridgeAPI();
    config = {
      name: "Test Platform Configuration",
      platform: "free@home Unit Testing Platform",
      ignoredChannels: ["ABB700000002/ch0005", "ABB700000003/*"],
    };
    logger = {
      debug: jasmine.createSpy(),
      error: jasmine.createSpy(),
      info: jasmine.createSpy(),
      warn: jasmine.createSpy(),
      log: jasmine.createSpy(),
    };
  });

  it("should be created", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    expect(platform).toBeTruthy();
  });

  it("should handle API lifecycle events", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      webSocketSubscription: Subscription;
      discoverDevices: () => Promise<void>;
    };
    const spyWsConnect = spyOn(platform.sysap, "connectWebSocket");
    const spyUnsubscribe = spyOn(instance.webSocketSubscription, "unsubscribe");
    const spyDiscovery = spyOn(instance, "discoverDevices").and.resolveTo();
    api.emit("didFinishLaunching");
    expect(spyWsConnect).toHaveBeenCalled();
    expect(spyDiscovery).toHaveBeenCalled();
    api.emit("shutdown");
    expect(spyUnsubscribe).toHaveBeenCalled();
  });

  it("should handle device discovery failure", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      discoverDevices: () => Promise<void>;
    };
    spyOn(platform.sysap, "connectWebSocket");
    const spyDiscovery = spyOn(instance, "discoverDevices").and.rejectWith(
      "Test Error"
    );
    api.emit("didFinishLaunching");
    expect(spyDiscovery).toHaveBeenCalled();
  });

  it("should reset connection attempt count when websocket is connected", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      wsConnectionAttempt: number;
      sysap: SystemAccessPoint;
    };
    instance.wsConnectionAttempt = 3;
    instance.sysap.emit("websocket-open");
    expect(instance.wsConnectionAttempt).toBe(0);
  });

  it("should handle expected websocket closure", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const spy = spyOn(platform.sysap, "connectWebSocket");
    platform.sysap.emit("websocket-close", 1000, Buffer.from("Bye"));
    expect(spy).not.toHaveBeenCalled();
  });

  it("should not attempt to reconnect after reconnection attempt limit was reached", () => {
    config.maxWsRetryCount = 3;
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      wsConnectionAttempt: number;
    };
    instance.wsConnectionAttempt = 3;
    const spy = spyOn(platform.sysap, "connectWebSocket");
    platform.sysap.emit(
      "websocket-close",
      1234,
      Buffer.from("Disconnect Test")
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it("should attempt to reconnect if reconnection attempt limit is not reached", () => {
    jasmine.clock().install();
    config.maxWsRetryCount = 3;
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      wsConnectionAttempt: number;
    };
    const spy = spyOn(platform.sysap, "connectWebSocket");
    platform.sysap.emit(
      "websocket-close",
      1234,
      Buffer.from("Disconnect Test")
    );
    jasmine.clock().tick(230);
    expect(spy).toHaveBeenCalled();
    expect(instance.wsConnectionAttempt).toBe(1);
    jasmine.clock().uninstall();
  });

  it("should receive message from SysAP websocket", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      readonly sysap: {
        readonly webSocketMessageSubject: Subject<WebSocketMessage>;
      };
      processWebSocketMesage: (message: WebSocketMessage) => void;
    };
    const spy = spyOn(instance, "processWebSocketMesage");
    instance.sysap.webSocketMessageSubject.next({});
    expect(spy).toHaveBeenCalledWith({});
  });

  it("should forward log messages from SysAP to Homebridge logger", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      readonly sysap: {
        readonly logger: FahLogger;
      };
    };
    /* eslint-disable @typescript-eslint/unbound-method */
    instance.sysap.logger.debug("Debug");
    expect(logger.debug).toHaveBeenCalledWith("Debug");
    instance.sysap.logger.error("Error");
    expect(logger.error).toHaveBeenCalledWith("Error");
    instance.sysap.logger.log("Log");
    expect(logger.info).toHaveBeenCalledWith("Log");
    instance.sysap.logger.warn("Warn");
    expect(logger.warn).toHaveBeenCalledWith("Warn");
    /* eslint-enable @typescript-eslint/unbound-method */
  });

  it("should configure free@home accessory", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      readonly sysap: {
        readonly logger: FahLogger;
      };
    };
    expect(platform.accessories.length).toBe(0);
    const platformAccessory = new PlatformAccessory(
      "Test Accessory",
      EmptyGuid
    );
    platformAccessory.context = {
      channel: {},
      channelId: "ch1234",
      device: {},
      deviceSerial: "ABB7xxxxxxxx",
    };
    if (!isFreeAtHomeAccessory(platformAccessory, instance.sysap.logger)) {
      fail();
      return;
    }
    platform.configureAccessory(platformAccessory);
    expect(platform.accessories.length).toBe(1);
    expect(platform.accessories[0]).toBe(platformAccessory);
  });

  it("should not configure non-free@home accessory", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    expect(platform.accessories.length).toBe(0);
    const platformAccessory = new PlatformAccessory(
      "Test Accessory",
      EmptyGuid
    );
    platformAccessory.context = {};
    platform.configureAccessory(platformAccessory);
    expect(platform.accessories.length).toBe(0);
  });

  it("should not configure ignored accessory", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    expect(platform.accessories.length).toBe(0);
    const platformAccessory = new PlatformAccessory(
      "Test Accessory",
      EmptyGuid
    );
    platformAccessory.context = {
      channel: {},
      channelId: "ch0005",
      device: {},
      deviceSerial: "ABB700000002",
    };
    platform.configureAccessory(platformAccessory);
    expect(platform.accessories.length).toBe(0);
  });

  it("should discover devices from the system access point", async () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      readonly fahAccessories: Map<string, FreeAtHomeAccessory>;
      readonly sysap: {
        readonly logger: FahLogger;
      };
      discoverDevices(): Promise<void>;
    };
    const knownAccessory = new PlatformAccessory(
      "Known Device",
      api.hap.uuid.generate("ABB700000002_ch0000")
    );
    knownAccessory.context = {
      channel: {
        functionID: "23",
      },
      channelId: "ch0000",
      device: {
        floor: "1",
        room: "1",
        channels: {
          ch0000: {
            functionID: "23",
          },
        },
      },
      deviceSerial: "ABB700000002",
    };
    if (!isFreeAtHomeAccessory(knownAccessory, instance.sysap.logger)) {
      fail();
      return;
    }

    platform.accessories.push(knownAccessory);
    spyOn(platform.sysap, "getConfiguration").and.resolveTo(configuration);
    await instance.discoverDevices();
    expect(instance.fahAccessories.size).toBe(7);
  });

  it("should discover devices from the system access point without ignore list", async () => {
    delete config.ignoredChannels;

    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      readonly fahAccessories: Map<string, FreeAtHomeAccessory>;
      readonly sysap: {
        readonly logger: FahLogger;
      };
      discoverDevices(): Promise<void>;
    };
    spyOn(platform.sysap, "getConfiguration").and.resolveTo(configuration);
    await instance.discoverDevices();
    expect(instance.fahAccessories.size).toBe(10);
  });

  it("should discover devices from the system access point in experimental mode", async () => {
    config.experimental = true;
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(logger.warn).toHaveBeenCalledWith("Experimental Mode enabled!");
    const instance = platform as unknown as {
      readonly fahAccessories: Map<string, FreeAtHomeAccessory>;
      readonly sysap: {
        readonly logger: FahLogger;
      };
      discoverDevices(): Promise<void>;
    };
    spyOn(platform.sysap, "getConfiguration").and.resolveTo(configuration);
    await instance.discoverDevices();
    expect(instance.fahAccessories.size).toBe(11);
  });

  it("should not create an accessory for an unknown function ID", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      readonly fahAccessories: Map<string, FreeAtHomeAccessory>;
      readonly sysap: {
        readonly logger: FahLogger;
      };
      createAccessory: (
        serial: string,
        functionID: string,
        channelId: string,
        accessory: PlatformAccessory<FreeAtHomeContext>
      ) => void;
    };
    const platformAccessory = new PlatformAccessory(
      "Known Device",
      api.hap.uuid.generate("ABB700000002_ch0000")
    );
    platformAccessory.context = {
      channel: {
        functionID: "23",
      },
      channelId: "ch0000",
      device: {
        floor: "1",
        room: "1",
        channels: {
          ch0000: {
            functionID: "23",
          },
        },
      },
      deviceSerial: "ABB700000002",
    };
    if (!isFreeAtHomeAccessory(platformAccessory, instance.sysap.logger)) {
      fail();
      return;
    }

    const spy = spyOn(instance.fahAccessories, "set");
    instance.createAccessory("", "never", "", platformAccessory);
    expect(spy).not.toHaveBeenCalled();
  });

  it("should process web socket message", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      readonly fahAccessories: Map<string, FreeAtHomeAccessory>;
      readonly sysap: {
        readonly logger: FahLogger;
      };
      processWebSocketMesage: (message: WebSocketMessage) => void;
    };
    const platformAccessory = new PlatformAccessory(
      "Known Device",
      api.hap.uuid.generate("ABB700000002_ch0000")
    );
    platformAccessory.context = {
      channel: {
        functionID: "23",
      },
      channelId: "ch0000",
      device: {
        floor: "1",
        room: "1",
        channels: {
          ch0000: {
            functionID: "23",
          },
        },
      },
      deviceSerial: "ABB700000002",
    };
    if (!isFreeAtHomeAccessory(platformAccessory, instance.sysap.logger)) {
      fail();
      return;
    }

    const accessory = new TestAccessory(platform, platformAccessory);
    const spy = spyOn(accessory, "updateDatapoint");
    instance.fahAccessories.set("ABB700000002_ch0000", accessory);
    const message: WebSocketMessage = {
      "00000000-0000-0000-0000-000000000000": {
        datapoints: {
          "ABB700000002/ch0000/idp0000": "1",
          "ABB700000002/ch0000/odp0000": "2",
          "ABB700000000/ch0000/odp0000": "3",
        },
        devices: {},
        devicesAdded: [],
        devicesRemoved: [],
        scenesTriggered: {},
      },
    };
    instance.processWebSocketMesage(message);
    expect(spy.calls.count()).toBe(1);
    expect(spy).toHaveBeenCalledWith("odp0000", "2");
  });

  it("should resolve to mapped type", async () => {
    config.typeMappings = [{ channel: "ABB700000005/ch0001", type: "Outlet" }];
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      readonly fahAccessories: Map<string, FreeAtHomeAccessory>;
      discoverDevices(): Promise<void>;
    };
    spyOn(platform.sysap, "getConfiguration").and.resolveTo(configuration);
    await instance.discoverDevices();
    const accessory = instance.fahAccessories.get("ABB700000005_ch0001");
    expect(accessory).toBeDefined();
    expect(accessory).toBeInstanceOf(SwitchActuatorAccessory);
    expect((accessory as SwitchActuatorAccessory).accessoryType).toBe(
      AccessoryType.Outlet
    );
  });

  it("should resolve to unknown mapped types to Undefined", async () => {
    config.typeMappings = [{ channel: "ABB700000005/ch0001", type: "outlet" }];
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      readonly fahAccessories: Map<string, FreeAtHomeAccessory>;
      discoverDevices(): Promise<void>;
    };
    spyOn(platform.sysap, "getConfiguration").and.resolveTo(configuration);
    await instance.discoverDevices();
    const accessory = instance.fahAccessories.get("ABB700000005_ch0001");
    expect(accessory).toBeDefined();
    expect(accessory).toBeInstanceOf(SwitchActuatorAccessory);
    expect((accessory as SwitchActuatorAccessory).accessoryType).toBe(
      AccessoryType.Undefined
    );
  });

  it("should use the first mapping rule to resolve the mapped types if a channel has multiple mappings", async () => {
    config.typeMappings = [
      { channel: "ABB700000005/ch0001", type: "Outlet" },
      { channel: "ABB700000005/ch0001", type: "outlet" },
    ];
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    const instance = platform as unknown as {
      readonly fahAccessories: Map<string, FreeAtHomeAccessory>;
      discoverDevices(): Promise<void>;
    };
    spyOn(platform.sysap, "getConfiguration").and.resolveTo(configuration);
    await instance.discoverDevices();
    const accessory = instance.fahAccessories.get("ABB700000005_ch0001");
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(logger.warn).toHaveBeenCalledWith(
      "Multiple type mappings are defined for channel 'ABB700000005/CH0001'. The first mapping is used."
    );
    expect(accessory).toBeDefined();
    expect(accessory).toBeInstanceOf(SwitchActuatorAccessory);
    expect((accessory as SwitchActuatorAccessory).accessoryType).toBe(
      AccessoryType.Outlet
    );
  });
});
