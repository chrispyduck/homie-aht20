import AHT20 from "./AHT20";
import * as chai from "chai";
import winston from "winston";

// eslint-disable-next-line @typescript-eslint/no-var-requires
chai.use(require("chai-events"));

type ChaiEmit = {
  emit: (name: string, validator: (value: number) => void) => void,
};

describe("AHT20", () => {
  it("Reads valid data #Integration", async () => {
    const device = new AHT20();
    const emitAssertion = <ChaiEmit><unknown>chai.expect(device);
    emitAssertion.emit("humidity", (h: number) => {
      winston.info(`Humidity: ${h}`);
      chai.expect(h).to.be.within(1, 100);
    });
    emitAssertion.emit("temperature", (t: number) => {
      winston.info(`Temperature: ${t}`);
      chai.expect(t).to.be.within(1, 120);
    });
    await device.init();
    await new Promise<void>(r => setTimeout(() => r(), 1000));
    winston.info(JSON.stringify({
      humidity: device.humidity,
      temperature: device.temperature,
    }));
  });
});