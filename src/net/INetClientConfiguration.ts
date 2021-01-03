import { ISensorConfiguration } from "../ISensor";

export interface INetClientConfiguration extends ISensorConfiguration {
  type: "net";

  /**
   * 
   */
  netType: string;
}

export interface IHttpScraperConfiguration extends INetClientConfiguration {
  netType: "http-scraper"

  /**
   * The URL to scrape
   */
  url: string;
}

export interface ICableModemScraperConfiguration extends INetClientConfiguration {
  netType: "arris-surfboard-scraper"

  /**
   * The URL to scrape
   */
  url: string;

  downstreamChannels: number;

  upstreamChannels: number;
}