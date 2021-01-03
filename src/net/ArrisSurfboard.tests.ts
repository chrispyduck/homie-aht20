import { HomieDevice } from "@chrispyduck/homie-device";
import ArrisSurfboard from "./ArrisSurfboard";
//import winston from "winston";

describe("Arris Surfboard", () => {
  it("Reads valid data #Integration", async () => {
    const device = new ArrisSurfboard();
    await device.init();
    const result = await device.read();
    console.log(JSON.stringify(result, null, 2));
  }).timeout(30000);

  it("Registers with homie-device", async () => {
    const homieDevice = new HomieDevice({
      name: "test",
      friendlyName: "test",
    });
    const device = new ArrisSurfboard();
    await device.init();
    device.register(homieDevice);
  });
});