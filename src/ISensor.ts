import { HomieDevice, IHomieNodeConfiguration } from "@chrispyduck/homie-device";
import { EventEmitter } from "events";

/* eslint-disable semi */ // seems to be a bug

export interface ISensorType<TConfig extends ISensorConfiguration, TResult extends Record<never, any>> {
  new(config?: TConfig): ISensor<TResult>;
  DefaultConfiguration: TConfig;
}

export interface ISensorEvents<TResult> {
  "init": () => void;
  "read": (result: TResult) => void;
}

export interface ISensor<TResult extends Record<never, any>> extends EventEmitter {
  register(device: HomieDevice): void;
  read(): Promise<TResult>;
  init(): Promise<void>;

  on<U extends keyof ISensorEvents<TResult>>(
    event: U, listener: ISensorEvents<TResult>[U]
  ): this;

  emit<U extends keyof ISensorEvents<TResult>>(
    event: U, ...args: Parameters<ISensorEvents<TResult>[U]>
  ): boolean;
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
