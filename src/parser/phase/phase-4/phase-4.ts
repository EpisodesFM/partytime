/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { logger } from "../../../logger";
import {
  ensureArray,
  extractOptionalFloatAttribute,
  firstIfArray,
  getAttribute,
  getKnownAttribute,
  getText,
  knownLookup,
  lookup,
  pubDateToDate,
} from "../../shared";
import type { EmptyObj, XmlNode } from "../../types";
import * as ItemParser from "../../item";
import { addSubTag, getSubTags, useParser } from "../helpers";
import { extractRecipients, validRecipient } from "../value-helpers";
import type { FeedUpdate } from "../index";

import {
  Phase4Medium,
  Phase4ContentLink,
  Phase4PodcastImage,
  Phase4Value,
  Phase4LiveStatus,
  Phase4PodcastLiveItem,
  Phase4PodcastLiveItemItem,
} from "./types";

export const value = {
  phase: 4,
  tag: "podcast:value",
  name: "value",
  nodeTransform: firstIfArray,
  supportCheck: (node: XmlNode): boolean =>
    Boolean(getAttribute(node, "type")) &&
    Boolean(getAttribute(node, "method")) &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    ensureArray(node["podcast:valueRecipient"]).filter(validRecipient).length > 0,
  fn(node: XmlNode): { value: Phase4Value } {
    const item = {};
    getSubTags("value").forEach((updater) => {
      useParser(updater, node, item);
    });

    return {
      value: {
        type: getKnownAttribute(node, "type"),
        method: getKnownAttribute(node, "method"),
        ...extractOptionalFloatAttribute(node, "suggested"),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        recipients: extractRecipients(ensureArray(node["podcast:valueRecipient"])),
        ...item,
      },
    };
  },
};
addSubTag("liveItem", value);

export const medium: FeedUpdate = {
  tag: "podcast:medium",
  name: "medium",
  phase: 4,
  nodeTransform: (node: XmlNode) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray<XmlNode>(node).find(
      (n) => getText(n) && lookup(Phase4Medium, getText(n).toLowerCase())
    ),
  supportCheck: (node: XmlNode) => Boolean(node) && Boolean(getText(node)),
  fn(node: XmlNode): { medium: Phase4Medium } {
    const nodeValue = getText(node);
    if (nodeValue) {
      const parsed = lookup(Phase4Medium, nodeValue.toLowerCase());
      if (parsed) {
        return { medium: parsed };
      }
    }
    throw new Error("Unable to extract medium from feed, `supportCheck` needs to be updated");
  },
};

export const podcastImages = {
  phase: 4,
  name: "images",
  tag: "podcast:images",
  nodeTransform: (node: XmlNode | XmlNode[]): XmlNode =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).find((n) => getAttribute(n, "srcset")),
  supportCheck: (node: XmlNode): boolean => Boolean(node),
  fn(node: XmlNode): { podcastImages: Phase4PodcastImage[] } {
    return {
      podcastImages: (getKnownAttribute(node, "srcset")
        .split(",")
        .reduce<Phase4PodcastImage[]>((acc, n) => {
          const raw = n.trim();
          if (raw) {
            const components = raw.split(/\s+/);
            const val: Partial<Phase4PodcastImage> = { raw };
            if (components.length === 2) {
              if (components[1].endsWith("w")) {
                val.parsed = {
                  url: components[0],
                  width: parseInt(components[1].replace(/w$/, ""), 10),
                };
              } else if (components[1].endsWith("x")) {
                val.parsed = {
                  url: components[0],
                  density: parseFloat(components[1].replace(/x$/, "")),
                };
              } else {
                logger.warn(components, "Unexpected descriptor");
                val.parsed = {
                  url: components[0],
                };
              }
            } else {
              val.parsed = { url: raw };
            }
            return [...acc, val as Phase4PodcastImage];
          }
          return acc;
        }, [] as Phase4PodcastImage[]) as unknown) as Phase4PodcastImage[],
    };
  },
};
addSubTag("liveItem", podcastImages);

function getContentLinks(node: XmlNode): Phase4ContentLink[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return ensureArray(node["podcast:contentLink"]).map((cln) => ({
    title: getText(cln),
    url: getAttribute(cln, "href") ?? "",
  }));
}

export const liveItem = {
  phase: 4,
  tag: "podcast:liveItem",
  name: "liveItem",
  nodeTransform: (node: XmlNode[] | XmlNode): XmlNode[] =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    ensureArray(node).filter((n) =>
      Boolean(
        n &&
          getAttribute(n, "status") &&
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          lookup(Phase4LiveStatus, getAttribute(n, "status")!.toLowerCase()) &&
          getAttribute(n, "start")
      )
    ),
  supportCheck: (node: XmlNode[]): boolean => node.length > 0,
  fn(node: XmlNode[]): { podcastLiveItems: Phase4PodcastLiveItem[] } {
    return {
      podcastLiveItems: node
        .map((n) => {
          const guid = ItemParser.getGuid(n);
          const title = ItemParser.getTitle(n);
          const enclosure = ItemParser.getEnclosure(n);
          if (!(guid && title && enclosure)) {
            return {} as EmptyObj;
          }

          const item: Phase4PodcastLiveItemItem = {
            guid,
            enclosure,
            ...title,
            ...ItemParser.getDescription(n),
            ...ItemParser.getLink(n),
            ...ItemParser.getAuthor(n),
            ...ItemParser.getImage(n),
          };

          getSubTags("liveItem").forEach((tag) => {
            useParser(tag, n, item);
          });

          const chatAttribute = getAttribute(n, "chat");
          if (!item.chat && chatAttribute) {
            item.chat = {
              phase: "4",
              url: chatAttribute,
            };
          }

          return {
            status: knownLookup(Phase4LiveStatus, getKnownAttribute(n, "status").toLowerCase()),
            start: pubDateToDate(getKnownAttribute(n, "start")),
            ...(getAttribute(n, "end")
              ? { end: pubDateToDate(getKnownAttribute(n, "end")) }
              : undefined),
            ...(Object.keys(item).length > 0 ? item : undefined),
            contentLinks: getContentLinks(n),
          } as Phase4PodcastLiveItem;
        })
        .filter((x: EmptyObj | Phase4PodcastLiveItem) =>
          Boolean("start" in x)
        ) as Phase4PodcastLiveItem[],
    };
  },
};
