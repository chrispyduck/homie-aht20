import { HomieDevice } from "@chrispyduck/homie-device";

export default interface ISensor {
  register(device: HomieDevice): void;
}
