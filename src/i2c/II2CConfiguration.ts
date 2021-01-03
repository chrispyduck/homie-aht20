import { ISensorConfiguration } from "../ISensor";

export interface II2CConfiguration extends ISensorConfiguration {
  type: "i2c",

  /**
   * The model number of the sensor
   */
  model: string;

  /**
   * The I2C bus number where the device may be found
   */
  busNumber: number;

  /**
   * The ID of the device on the specified I2C bus
   */
  deviceId: number;
}
