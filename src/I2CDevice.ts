import i2c from "i2c-bus";
import winston from "winston";
import { merge } from "lodash";
import { II2CCommand } from "./II2CCommand";
import AHT20 from "./AHT20";
import { II2CConfiguration } from "./II2CConfiguration";
import { EventEmitter } from "events";

export abstract class I2CDevice extends EventEmitter {
  constructor(deviceType: string, configuration?: II2CConfiguration) {
    super();
    this.configuration = merge({}, AHT20.DefaultConfiguration, configuration);
    this.logger = winston.child({
      type: deviceType,
      name: 'default',
    });
  }

  protected readonly configuration: II2CConfiguration;
  protected readonly logger: winston.Logger;
  private bus$?: i2c.PromisifiedBus;

  protected get bus(): i2c.PromisifiedBus {
    if (!this.bus$)
      throw new Error("Bus has not been opened. Did you forget to call init()?");
    return this.bus$;
  }

  public init = async (): Promise<void> => {
    this.logger.verbose(`Opening I2C bus #${this.configuration.busNumber}`);
    this.bus$ = await i2c.openPromisified(this.configuration.busNumber);
    this.onInit();
  };

  protected abstract onInit(): Promise<void>;

  protected delay = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

  protected sendCommand = async (cmd: II2CCommand): Promise<void> => {
    if (cmd.args)
      await this.bus?.writeI2cBlock(this.configuration.deviceId, cmd.id, cmd.args.length, cmd.args);

    else
      await this.bus?.sendByte(this.configuration.deviceId, cmd.id);

    await this.delay(cmd.delay);
  };
}
