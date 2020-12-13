import { HomieDevice } from "@chrispyduck/homie-device";

/* eslint-disable semi */ // seems to be a bug

export default interface ISensor {
  register(device: HomieDevice): void;
}
