import { AtpAgent } from "npm:@atproto/api";
import "jsr:@std/dotenv/load";
import { DOMParser } from "jsr:@b-fuze/deno-dom";
import { decode } from "npm:imagescript";

const dateObj = new Date();
const month = dateObj.getUTCMonth() + 1;
const day = dateObj.getUTCDate();
const year = dateObj.getUTCFullYear();

const random: boolean = !!Deno.env.get("RANDOM")!;

const fetchUrl = random
  ? `https://www.gocomics.com/random/heathcliff `
  : `https://www.gocomics.com/heathcliff/${year}/${month}/${day}`;

async function main() {
  try {
    const response = await fetch(fetchUrl);

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html")!;
    const text =
      `${random ? "From the Heathcliff archive! " : "Today's Heathcliff, "}` +
      doc.querySelector(
        "input.cal",
      )!.getAttribute("placeholder")!.trim();
    const imageTag = doc.querySelector(".item-comic-image img")!;
    const imageUrl = imageTag.getAttribute("src")!;
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    const agent = new AtpAgent({
      service: "https://bsky.social",
    });

    await agent.login({
      identifier: Deno.env.get("BLUESKY_USERNAME")!,
      password: Deno.env.get("BLUESKY_PASSWORD")!,
    });

    const panel = decode(await imageBlob.arrayBuffer());
    const w = (await panel).width;
    const h = (await panel).height;

    const blobResp = await agent.uploadBlob(imageBlob);

    await agent.post({
      text: text,
      embed: {
        $type: "app.bsky.embed.images",
        images: [{
          image: blobResp.data.blob,
          alt: text,
          aspectRatio: {
            width: w,
            height: h,
          },
        }],
      },
    });
    console.log("Just posted!");
  } catch (err) {
    console.error(err);
  }
}

main();
