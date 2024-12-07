import { AtpAgent } from "npm:@atproto/api";
import "jsr:@std/dotenv/load";
import { DOMParser } from "jsr:@b-fuze/deno-dom";

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
    const text = doc.querySelector(".gc-container h1")!.innerText.trim();
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

    const blobResp = await agent.uploadBlob(imageBlob);

    console.log(blobResp);

    await agent.post({
      text: text,
      embed: {
        $type: "app.bsky.embed.images",
        images: [{
          image: blobResp.data.blob,
          alt: text,
        }],
      },
    });
    console.log("Just posted!");
  } catch (err) {
    console.error(err);
  }
}

main();
