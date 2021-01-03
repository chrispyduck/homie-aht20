import { HomieDevice, HomieNode, HomieProperty, PropertyDataType } from "@chrispyduck/homie-device";
import { ISensor, staticImplements, ISensorType } from "../ISensor";
import { ICableModemScraperConfiguration } from "./INetClientConfiguration";
import { merge } from "lodash";
import jsdom from "jsdom";

@staticImplements<ISensorType<ICableModemScraperConfiguration, IMetrics>>()
export default class ArrisSurfboardStatus implements ISensor<IMetrics> {

  public static readonly DefaultConfiguration: ICableModemScraperConfiguration = {
    type: "net",
    netType: "arris-surfboard-scraper",
    node: {
      name: "arris-surfboard",
      friendlyName: "Arris Surfboard Cable Modem",
      type: "Cable Modem",
      isRange: false,
    },
    downstreamChannels: 33,
    upstreamChannels: 3,
    url: "http://192.168.100.1",
  };

  constructor(config?: ICableModemScraperConfiguration) {
    this.config = merge({}, ArrisSurfboardStatus.DefaultConfiguration, config);
  }

  private readonly config: ICableModemScraperConfiguration;
  private homieRegistration: null | {
    state: {
      node: HomieNode,
      connectivityState: HomieProperty,
      bootState: HomieProperty,
      configurationFile: HomieProperty,
      security: HomieProperty,
      net: HomieProperty,
    },
    downstreamChannels: {
      node: HomieNode,
      id: HomieProperty,
      lockStatus: HomieProperty,
      modulation: HomieProperty,
      frequency: HomieProperty,
      power: HomieProperty,
      snr: HomieProperty,
      correctedFrames: HomieProperty,
      uncorrectableFrames: HomieProperty,
    },
    upstreamChannels: {
      node: HomieNode,
      id: HomieProperty,
      lockStatus: HomieProperty,
      channelType: HomieProperty,
      frequency: HomieProperty,
      width: HomieProperty,
      power: HomieProperty,
    },
  } = null

  register(device: HomieDevice): void {
    const stateNode = device.node({
      ...this.config.node,
      name: `${this.config.node.name}-state`,
      friendlyName: `${this.config.node.friendlyName} - State`,
      isRange: false,
    });
    const state = {
      node: stateNode,
      connectivityState: stateNode.addProperty({
        name: "connectivity",
        friendlyName: "Connectivity State",
        dataType: PropertyDataType.string,
        settable: false,
        retained: true,
      }),
      bootState: stateNode.addProperty({
        name: "bootState",
        friendlyName: "Boot State",
        dataType: PropertyDataType.string,
        settable: false,
        retained: true,
      }),
      configurationFile: stateNode.addProperty({
        name: "configurationFile",
        friendlyName: "Configuration File Status",
        dataType: PropertyDataType.string,
        settable: false,
        retained: true,
      }),
      security: stateNode.addProperty({
        name: "security",
        friendlyName: "Security State",
        dataType: PropertyDataType.string,
        settable: false,
        retained: true,
      }),
      net: stateNode.addProperty({
        name: "net",
        friendlyName: "DOCSIS Network Access Enabled",
        dataType: PropertyDataType.boolean,
        settable: false,
        retained: true,
      }),
    };

    const downstreamNode = device.node({
      ...this.config.node,
      name: `${this.config.node.name}-downstream`,
      friendlyName: `${this.config.node.friendlyName} - Downstream`,
      isRange: true,
      startRange: 0,
      endRange: this.config.downstreamChannels - 1,
    });
    const downstreamChannels = {
      node: downstreamNode,
      id: downstreamNode.addProperty({
        name: "id",
        friendlyName: "Channel ID",
        dataType: PropertyDataType.integer,
        settable: false,
        retained: true
      }),
      lockStatus: downstreamNode.addProperty({
        name: "lockStatus",
        friendlyName: "Lock Status",
        dataType: PropertyDataType.enum,
        format: "Locked,Not Locked",
        settable: false,
        retained: true
      }),
      modulation: downstreamNode.addProperty({
        name: "modulation",
        friendlyName: "Modulation",
        dataType: PropertyDataType.string,
        settable: false,
        retained: true
      }),
      frequency: downstreamNode.addProperty({
        name: "frequency",
        friendlyName: "Frequency",
        dataType: PropertyDataType.float,
        unit: "MHz",
        settable: false,
        retained: true
      }),
      power: downstreamNode.addProperty({
        name: "power",
        friendlyName: "Power",
        dataType: PropertyDataType.float,
        unit: "dBmV",
        settable: false,
        retained: true
      }),
      snr: downstreamNode.addProperty({
        name: "snr",
        friendlyName: "Signal to Noise Ratio",
        dataType: PropertyDataType.float,
        unit: "dB",
        settable: false,
        retained: true
      }),
      correctedFrames: downstreamNode.addProperty({
        name: "correctedFrames",
        friendlyName: "Corrected Frames",
        dataType: PropertyDataType.integer,
        settable: false,
        retained: true
      }),
      uncorrectableFrames: downstreamNode.addProperty({
        name: "uncorrectableFrames",
        friendlyName: "Uncorrectable Frames",
        dataType: PropertyDataType.integer,
        settable: false,
        retained: true
      }),
    };

    const upstreamNode = device.node({
      ...this.config.node,
      name: `${this.config.node.name}-upstream`,
      friendlyName: `${this.config.node.friendlyName} - Upstream`,
      isRange: true,
      startRange: 0,
      endRange: this.config.upstreamChannels - 1,
    });
    const upstreamChannels = {
      node: upstreamNode,
      id: upstreamNode.addProperty({
        name: "id",
        friendlyName: "Channel ID",
        dataType: PropertyDataType.integer,
        settable: false,
        retained: true
      }),
      lockStatus: upstreamNode.addProperty({
        name: "lockStatus",
        friendlyName: "Lock Status",
        dataType: PropertyDataType.enum,
        format: "Locked,Not Locked",
        settable: false,
        retained: true
      }),
      channelType: upstreamNode.addProperty({
        name: "usChannelType",
        friendlyName: "US Channel Type",
        dataType: PropertyDataType.string,
        settable: false,
        retained: true
      }),
      frequency: upstreamNode.addProperty({
        name: "frequency",
        friendlyName: "Frequency",
        dataType: PropertyDataType.float,
        unit: "MHz",
        settable: false,
        retained: true
      }),
      width: upstreamNode.addProperty({
        name: "width",
        friendlyName: "Width",
        dataType: PropertyDataType.float,
        unit: "Hz",
        settable: false,
        retained: true
      }),
      power: upstreamNode.addProperty({
        name: "power",
        friendlyName: "Power",
        dataType: PropertyDataType.float,
        unit: "dBmV",
        settable: false,
        retained: true
      }),
    };

    this.homieRegistration = {
      state,
      downstreamChannels,
      upstreamChannels,
    };
  }

  read = async (): Promise<IMetrics> => {
    const dom = await jsdom.JSDOM.fromURL(this.config.url);
    const tables = dom.window.document.querySelectorAll("table");
    if (tables.length !== 3)
      throw new Error(`Expected 3 tables but found ${tables.length}`);

    const metrics: IMetrics = {
      startupProcedureStatus: this.extractSummary(tables[0].getElementsByTagName("tr")),
      downstreamChannels: this.extractDownstreamChannels(tables[1].getElementsByTagName("tr")),
      upstreamChannels: this.extractUpstreamChannels(tables[2].getElementsByTagName("tr")),
    };
    
    if (this.homieRegistration) {
      this.homieRegistration.state.connectivityState.publishValue(metrics.startupProcedureStatus.connectivityState ?? "Unknown");
      this.homieRegistration.state.configurationFile.publishValue(metrics.startupProcedureStatus.configurationFileStatus ?? "Unknown");
      this.homieRegistration.state.bootState.publishValue(metrics.startupProcedureStatus.bootState ?? "Unknown");
      this.homieRegistration.state.net.publishValue(metrics.startupProcedureStatus.networkAccess === "Allowed");
      this.homieRegistration.state.security.publishValue(metrics.startupProcedureStatus.securityStatus ?? "Unknown");
      for (let i = 0; i < metrics.downstreamChannels.length; i++) {
        this.homieRegistration.downstreamChannels.id.publishValue(metrics.downstreamChannels[i].id, i);
        this.homieRegistration.downstreamChannels.lockStatus.publishValue(metrics.downstreamChannels[i].lockStatus, i);
        this.homieRegistration.downstreamChannels.frequency.publishValue(metrics.downstreamChannels[i].frequency, i);
        this.homieRegistration.downstreamChannels.modulation.publishValue(metrics.downstreamChannels[i].modulation, i);
        this.homieRegistration.downstreamChannels.power.publishValue(metrics.downstreamChannels[i].power, i);
        this.homieRegistration.downstreamChannels.snr.publishValue(metrics.downstreamChannels[i].snr, i);
        this.homieRegistration.downstreamChannels.correctedFrames.publishValue(metrics.downstreamChannels[i].corrected, i);
        this.homieRegistration.downstreamChannels.uncorrectableFrames.publishValue(metrics.downstreamChannels[i].uncorrectable);
      }
      for (let i = 0; i < metrics.upstreamChannels.length; i++) {
        this.homieRegistration.upstreamChannels.id.publishValue(metrics.upstreamChannels[i].id, i);
        this.homieRegistration.upstreamChannels.lockStatus.publishValue(metrics.upstreamChannels[i].lockStatus, i);
        this.homieRegistration.upstreamChannels.frequency.publishValue(metrics.upstreamChannels[i].frequency, i);
        this.homieRegistration.upstreamChannels.width.publishValue(metrics.upstreamChannels[i].width, i);
        this.homieRegistration.upstreamChannels.channelType.publishValue(metrics.upstreamChannels[i].channelType, i);
        this.homieRegistration.upstreamChannels.power.publishValue(metrics.upstreamChannels[i].power, i);
      }
    }

    return metrics;
  }

  init(): Promise<void> {
    return Promise.resolve();
  }

  private extractSummary = (rows: HTMLCollectionOf<HTMLTableRowElement>): IGeneralStatus => {
    const result: IGeneralStatus = {};
    for (let i = 2; i < rows.length; i++) {
      const caption = rows[i].children[0].innerHTML;
      const status = rows[i].children[1].innerHTML;
      const comment = rows[i].children[2].innerHTML;
      switch (caption) {
        case "Acquire Downstream Channel": {
          result.downstreamChannelFrequency = Number.parseInt(status) / 1000 / 1000;
          result.downstreamChannelStatus = comment;
          break;
        }
        case "Connectivity State": {
          result.connectivityState = status;
          break;
        }
        case "Boot State": {
          result.bootState = status;
          break;
        }
        case "Configuration File": {
          result.configurationFileStatus = status;
          break;
        }
        case "Security": {
          result.securityStatus = status;
          break;
        }
        case "DOCSIS Network Access Enabled": {
          result.networkAccess = status;
          break;
        }
      }
    }
    return result;
  }

  private extractDownstreamChannels = (rows: HTMLCollectionOf<HTMLTableRowElement>): Array<IDownstreamChannel> => {
    const result: Array<IDownstreamChannel> = [];
    for (var i = 2; i < rows.length; i++) {
      const channelID = Number.parseInt(rows[i].children[0].innerHTML);
      if (channelID > 0) {
        const cellValues = Array
          .from(rows[i].children)
          .map(cell => cell.innerHTML);
        const channel: IDownstreamChannel = {
          id: channelID,
          lockStatus: cellValues[1],
          modulation: cellValues[2],
          frequency: Number.parseInt(cellValues[3]) / 1000 / 1000,
          power: Number.parseFloat(cellValues[4]),
          snr: Number.parseFloat(cellValues[5]),
          corrected: Number.parseInt(cellValues[6]),
          uncorrectable: Number.parseInt(cellValues[7]),
        };
        result.push(channel);
      }
    }
    return result.sort((a, b) => a.id - b.id);
  }

  private extractUpstreamChannels = (rows: HTMLCollectionOf<HTMLTableRowElement>): Array<IUpstreamChannel> => {
    const result: Array<IUpstreamChannel> = [];
    for (var i = 2; i < rows.length; i++) {
      const channelNum = Number.parseInt(rows[i].children[0].innerHTML);
      if (channelNum > 0) {
        const cellValues = Array
          .from(rows[i].children)
          .map(cell => cell.innerHTML);
        const channel: IUpstreamChannel = {
          id: Number.parseInt(cellValues[1]),
          lockStatus: cellValues[2],
          channelType: cellValues[3],
          frequency: Number.parseInt(cellValues[4]) / 1000 / 1000,
          width: Number.parseFloat(cellValues[5]) / 1000 / 1000,
          power: Number.parseFloat(cellValues[6]),
        };
        result.push(channel);
      }
    }
    return result.sort((a, b) => a.id - b.id);
  }
}


export interface IMetrics {
  startupProcedureStatus: IGeneralStatus,
  downstreamChannels: Array<IDownstreamChannel>;
  upstreamChannels: Array<IUpstreamChannel>;
}

export interface IGeneralStatus {
  downstreamChannelStatus?: string; // LOCKED
  downstreamChannelFrequency?: number; // in MHz
  connectivityState?: string; // OK
  bootState?: string; // OK
  configurationFileStatus?: string;
  securityStatus?: string;
  networkAccess?: string;
}

export interface IChannel {
  id: number;

  /**
   * Whether this channel is locked
   */
  lockStatus: string;

  /**
   * Frequency in MHz
   */
  frequency: number;

  /**
   * Power in dBmV (floating point, negative or positive)
   */
  power: number;
}

export interface IDownstreamChannel extends IChannel {
  /**
   * Channel signal modulation
   */
  modulation: string;

  /**
   * Signal to Noise Ratio in dB
   */
  snr: number;

  /**
   * Corrected frames
   */
  corrected: number;

  /**
   * Uncorrectable frames
   */
  uncorrectable: number;
}

export interface IUpstreamChannel extends IChannel {
  channelType: string;

  /**
   * Channel width in Hz
   */
  width: number;
}
