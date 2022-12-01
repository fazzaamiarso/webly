import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { z } from "zod";
import { mongoClient } from "~/lib/mongodb.server";

const autocompleteSchema = z.array(
  z.object({
    _id: z.any(),
    name: z.string(),
    type: z.enum(["webinar", "seller"]),
    score: z.number(),
  })
);

export const loader = async ({ request }: LoaderArgs) => {
  const query = new URL(request.url).searchParams.get("q");
  const connection = await mongoClient;
  const webinarResults = await connection
    .db("webinar-app")
    .collection("Webinar")
    .aggregate([
      {
        $search: {
          compound: {
            should: [
              {
                autocomplete: {
                  query,
                  path: "name",
                  tokenOrder: "sequential",
                  fuzzy: {
                    maxExpansions: 256,
                    maxEdits: 2,
                    prefixLength: 1,
                  },
                  score: {
                    boost: {
                      value: 3,
                    },
                  },
                },
              },
              {
                text: {
                  query,
                  path: "name",
                  fuzzy: {
                    maxEdits: 2,
                  },
                },
              },
            ],
          },
        },
      },
      { $addFields: { type: "webinar" } },
      { $limit: 5 },
      {
        $project: {
          name: 1,
          type: 1,
          score: {
            $meta: "searchScore",
          },
        },
      },
    ])
    .toArray();

  const sellerResults = await connection
    .db("webinar-app")
    .collection("Seller")
    .aggregate([
      {
        $search: {
          index: "seller-autocomplete",
          compound: {
            should: [
              {
                autocomplete: {
                  query,
                  path: "name",
                  tokenOrder: "sequential",
                  fuzzy: {
                    maxExpansions: 256,
                    maxEdits: 2,
                    prefixLength: 1,
                  },
                  score: {
                    boost: {
                      value: 3,
                    },
                  },
                },
              },
              {
                text: {
                  query,
                  path: "name",
                  fuzzy: {
                    maxEdits: 2,
                  },
                },
              },
            ],
          },
        },
      },
      { $addFields: { type: "seller" } },
      { $limit: 5 },
      {
        $project: {
          name: 1,
          type: 1,
          score: {
            $meta: "searchScore",
          },
        },
      },
    ])
    .toArray();

  const searchResults = autocompleteSchema.parse([...webinarResults, ...sellerResults]);

  // sort score descending
  return json(searchResults.sort((a, b) => b.score - a.score));
};
