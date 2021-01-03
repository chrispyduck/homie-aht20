import { HomieDevice, IHomieNodeConfiguration } from "@chrispyduck/homie-device";

/* eslint-disable semi */ // seems to be a bug

export interface ISensorType<TConfig extends ISensorConfiguration, TResult extends Record<never, any>> {
  new(config?: TConfig): ISensor<TResult>;
  DefaultConfiguration: TConfig;
}

export interface ISensor<TResult extends Record<never, any>> {
  register(device: HomieDevice): void;
  read(): Promise<TResult>;
  init(): Promise<void>;

  
}

export interface ISensorConfiguration {
  /**
   * The homie node configuration for this sensor
   */
  node: IHomieNodeConfiguration

  /**
   * The sensor type 
   */
  type: string;
}

export function staticImplements<T>() {
  return <U extends T>(constructor: U) => { constructor };
}
