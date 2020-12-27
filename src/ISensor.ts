import { HomieDevice } from "@chrispyduck/homie-device";

/* eslint-disable semi */ // seems to be a bug

export default interface ISensor<TResult extends Record<never, any>> {
  register(device: HomieDevice): void;
  read(): Promise<TResult>;
}
