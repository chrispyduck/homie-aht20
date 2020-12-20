import { HomieDevice, PropertyDataType } from "@chrispyduck/homie-device";
import { merge } from "lodash";
import { I2CDevice } from "./I2CDevice";
import { II2CCommand } from "./II2CCommand";
import { II2CConfiguration } from "./II2CConfiguration";
import ISensor from "./ISensor";

export const I2C_ADDRESS = 0x38;

interface ICommands {
  status: II2CCommand,
  init: II2CCommand,
  measure: II2CCommand,
  reset: II2CCommand,
}
const commands: ICommands = {
  status: {
    delay: 200,
    id: 0x71,
  },
  init: {
    delay: 10,
    id: 0xBE,
    args: Buffer.from([0x08, 0x00]),
  },
  measure: {
    args: Buffer.from([0x33, 0x00]),
    delay: 80,
    id: 0xAC,
  },
  reset: {
    delay: 20,
    id: 0xBA,
  }
};

const COMMAND_STATUS_BIT_CALIBRATION_ENABLE = 3;
const COMMAND_STATUS_BIT_BUSY = 7;

enum State {
  Unknown = 0,
  Idle = 1,
  ReceiveStatus = 10,
  ReceiveMeasurement = 11,
  Reset = 99,
}

export default class AHT20 extends I2CDevice implements ISensor {

  public static readonly DefaultConfiguration: II2CConfiguration = {
    busNumber: 1,
    deviceId: I2C_ADDRESS
  };

  constructor(config?: II2CConfiguration) {
    super("AHT20", merge({}, AHT20.DefaultConfiguration, config));
  }

  private humidity$ = 0;
  public get humidity(): number { return this.humidity$; }

  private temperature$ = 0;
  public get temperature(): number { return this.temperature$; }

  private lastReset = new Date().getTime();
  private zeroReads = 0;

  private readonly buffer = Buffer.alloc(8);
  private state$ = State.Unknown;
  private setState = (value: State) => {
    if (value === this.state$)
      return;
    this.state$ = value;
    this.emit("state", value);
  }
  public get state(): State {
    return this.state$;
  }

  protected onInit = async (): Promise<void> => {
    const status = await this.queryStatus();
    if (!status.calibrationEnabled)
      await this.initializeDevice();
    await this.measure();
  }

  protected reeset = async (): Promise<void> => {
    this.lastReset = new Date().getTime();
    this.logger.verbose("Resetting AHT20");
    this.setState(State.Reset);
    await this.sendCommand(commands.reset);
    await this.onInit();
  }

  public register = (device: HomieDevice): void => {
    const node = device.node({
      name: "aht20",
      friendlyName: "AHT20", 
      type: "sensor",
      isRange: false,
    });
    const temperatureProperty = node.addProperty({
      dataType: PropertyDataType.float,
      name: "temperature",
      friendlyName: "Temperature",
      settable: false,
      format: "-20:120",
      unit: "°F",
      retained: true,
    });
    this.on("temperature", (t: number) => {
      temperatureProperty.publishValue(t);
    });
    const humidityProperty = node.addProperty({
      dataType: PropertyDataType.float,
      name: "humidity",
      friendlyName: "Humidity",
      settable: false,
      format: "0:100",
      unit: "%",
      retained: true,
    });
    this.on("humidity", (h: number) => {
      humidityProperty.publishValue(h);
    });
  }

  /**
   * Sends the status query command
   */
  private queryStatus = async (): Promise<IStatusResult> => {
    this.logger.verbose("Requesting device status");
    this.setState(State.ReceiveStatus);
    await this.sendCommand(commands.status);
    return await this.readStatus(State.Idle);
  }

  private readStatus = async (stateIfIdle: State = State.Idle): Promise<IStatusResult> => {
    const readResult = await this.bus.i2cRead(I2C_ADDRESS, 1, this.buffer);
    if (readResult.bytesRead !== 1)
      throw new Error(`Read an unexpected number of bytes in response. Got ${readResult.bytesRead} but expected 1.`);
    const byte = readResult.buffer.readUInt8(0);
    const result = {
      busy: (byte & (1 << COMMAND_STATUS_BIT_BUSY)) > 0,
      calibrationEnabled: (byte & (1 << COMMAND_STATUS_BIT_CALIBRATION_ENABLE)) > 0,
    };
    if (!result.busy)
      this.setState(stateIfIdle);
    this.logger.debug(`Received status response ${byte} (busy=${result.busy}, calibrationEnabled=${result.calibrationEnabled})`);
    return result;
  }

  private initializeDevice = async (): Promise<void> => {
    if (!this.bus)
      throw new Error("Bus has not been opened. Did you forget to call init()?");
    this.logger.verbose("Sending initialization command to AHT20");
    await this.sendCommand(commands.init);
  }

  private measure = async (): Promise<void> => {
    this.logger.debug("Requesting measurement");
    this.setState(State.ReceiveStatus);
    await this.sendCommand(commands.measure);
    let status = await this.readStatus(State.ReceiveMeasurement);
    while (status.busy) {
      await this.delay(10);
      status = await this.readStatus(State.ReceiveMeasurement);
    }

    /*
     * read the result. legend:
     *   byte  0  : ???
     *   bytes 1-2: humidity
     *   byte  3  : humidity / temperature
     *   bytes 4-5: temperature
     *   byte  6  : crc8, inital value 0xFF, CRC[7:0] = 1 + x^4 + x^5 + x^8 (optional)
     */
    const readResult = await this.bus.i2cRead(this.configuration.deviceId, 7, this.buffer);
    if (readResult.bytesRead < 5) {
      this.logger.warn(`Sensor returned ${readResult.bytesRead} bytes, but we need at least 5`);
      return;
    }

    // adapted from https://github.com/adafruit/Adafruit_AHTX0/blob/master/Adafruit_AHTX0.cpp#L142
    // humidity
    let hum = readResult.buffer[1];
    hum <<= 8;
    hum |= readResult.buffer[2];
    hum <<= 4;
    hum |= readResult.buffer[3] >> 4;
    hum = (hum * 100) / 0x100000;
    this.humidity$ = hum; // relative humidity, %

    // temperature
    let temp = readResult.buffer[3] & 0x0F;
    temp <<= 8;
    temp |= readResult.buffer[4];
    temp <<= 8;
    temp |= readResult.buffer[5];
    temp = (temp * 200 / 0x100000) - 50;
    this.temperature$ = temp * 1.8 + 32; // C to F conversion

    const crc_received = readResult.buffer[6];
    const crc_computed = this.crc8x_simple(readResult.buffer, 6);
    if (crc_received != crc_computed) {
      this.logger.warn(`Received invalid data from sensor (crc received=${crc_received}, computed=${crc_computed}): ${readResult.buffer.toString("hex")}`);
    } else if (this.humidity$ == 0 && this.temperature$ == 0) {
      this.zeroReads++;
      const now = new Date().getTime();
      const secondsSinceLastReset = (now - this.lastReset) / 1000;
      if (secondsSinceLastReset >= 90 && this.zeroReads >= 5) {
        this.logger.info(`Initiating automatic programmatic reset of AHT20 due to ${this.zeroReads} continuous all-zero readings`)
      } else {
        this.logger.debug(`Received all-zero reading; count=${this.zeroReads}, secondsSinceLastReset=${secondsSinceLastReset}`);
      }
    } else {
      this.zeroReads = 0;
      this.emit("humidity", this.humidity$);
      this.emit("temperature", this.temperature$);
    }
    this.setState(State.Idle);
  }

  // adapted from https://stackoverflow.com/questions/51752284/how-to-calculate-crc8-in-c
  private crc8x_simple = (input: Buffer, length: number) => {
    let crc = 0xFF;
    for (let i = 0; i < length; i++) {
      crc ^= input[i];
      for (let k = 0; k < 8; k++)
        crc = crc & 0x80 ? (crc << 1) ^ 0x31 : crc << 1;
    }
    crc &= 0xff;
    return crc;
  }
}

interface IStatusResult {
  calibrationEnabled: boolean;
  busy: boolean;
}