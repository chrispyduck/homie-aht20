import AHT20 from '../src/AHT20';
import * as chai from "chai";

chai.use(require("chai-events"));

type ChaiEmit = {
  emit: (name: string, validator: Function) => void,
};

describe("AHT20", () => {
  it('Reads valid data #Integration', async () => {
    var device = new AHT20();
    let emitAssertion = <ChaiEmit><unknown>chai.expect(device);
    emitAssertion.emit('humidity', (h: number) => {
      chai.expect(h).to.be.within(0, 100);
    });
    emitAssertion.emit('temperature', (t: number) => {
      chai.expect(t).to.be.within(0, 120);
    });
    await device.init();
  });
});