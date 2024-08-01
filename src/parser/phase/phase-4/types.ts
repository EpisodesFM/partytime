// eslint-disable-next-line import/no-cycle
import { Episode } from "../../types";
import type { PhasePendingChat, PhasePendingLiveUpdates } from "../phase-pending";
import type { Phase6ValueTimeSplit } from "../phase-6";

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#value
 *
 * This element designates the cryptocurrency or payment layer that will be used, the transport method for
 * transacting the payments, and a suggested amount denominated in the given cryptocurrency.
 *
 * Also see: https://github.com/Podcastindex-org/podcast-namespace/blob/main/value/value.md
 */
export type Phase4Value = {
  /**
   * This is the service slug of the cryptocurrency or protocol layer.
   *
   * lightning
   */
  type: string;
  /** This is the transport mechanism that will be used. keysend and amp are the only expected values */
  method: string;
  /** This is an optional suggestion on how much cryptocurrency to send with each payment. */
  suggested?: string;
  recipients: Phase4ValueRecipient[];
  valueTimeSplits?: Phase6ValueTimeSplit[];
};

export type Phase4ValueRecipient = {
  /** A free-form string that designates who or what this recipient is. */
  name?: string;
  /** The name of a custom record key to send along with the payment. */
  customKey?: string;
  /** A custom value to pass along with the payment. This is considered the value that belongs to the customKey. */
  customValue?: string;
  /** A slug that represents the type of receiving address that will receive the payment. */
  type: string;
  /** This denotes the receiving address of the payee. */
  address: string;
  /** The number of shares of the payment this recipient will receive. */
  split: number;
  fee: boolean;
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#images
 *
 * This tag, when present, allows for specifying many different image sizes in a compact way at either the
 * episode or channel level. The syntax is borrowed from the HTML5 srcset syntax. It allows for describing
 * multiple image sources with width and pixel hints directly in the attribute.
 */
type Phase4PodcastParsedImage =
  | {
      url: string;
      width: number;
    }
  | {
      url: string;
      density: number;
    }
  | { url: string };

export type Phase4PodcastImage = {
  raw: string;
  parsed: Phase4PodcastParsedImage;
};

/**
 * https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md#medium
 *
 */

export enum Phase4Medium {
  /** Describes a feed for a podcast show. If no medium tag is present in the channel, this medium is assumed. */
  Podcast = "podcast",
  /** A feed of music organized into an "album" with each item a song within the album */
  Music = "music",
  /** Like a "podcast" but used in a more visual experience. Something akin to a dedicated video channel like would be found on YouTube */
  Video = "video",
  /** Specific types of videos with one item per feed. This is different than a video medium because the content is considered to be cinematic; like a movie or documentary */
  Film = "film",
  /** Specific types of audio with one item per feed, or where items represent chapters within the book */
  Audiobook = "audiobook",
  /** a feed of curated written articles. Newsletter articles now sometimes have an spoken version audio enclosure attached */
  Newsletter = "newsletter",
  /** a feed of informally written articles. Similar to newsletter but more informal as in a traditional blog platform style */
  Blog = "blog",
}

export enum Phase4LiveStatus {
  Pending = "pending",
  Live = "live",
  Ended = "ended",
}
export type Phase4PodcastLiveItemItem = Pick<Episode, "title" | "guid" | "enclosure"> &
  Partial<
    Pick<
      Episode,
      | "description"
      | "link"
      | "author"
      | "podcastPeople"
      | "alternativeEnclosures"
      | "podcastImages"
      | "value"
    >
  > & {
    // phased in properties assumed to be dynamically added via addSubTag

    // Pending
    chat?: PhasePendingChat | { phase: "4"; url: string };
    /** PENDING AND LIKELY TO CHANGE */
    liveUpdates?: PhasePendingLiveUpdates;
  };
export type Phase4ContentLink = {
  url: string;
  title: string;
};

export type Phase4PodcastLiveItem = Phase4PodcastLiveItemItem & {
  status: Phase4LiveStatus;
  start: Date;
  end?: Date;
  image?: string;
  contentLinks: Phase4ContentLink[];
};
