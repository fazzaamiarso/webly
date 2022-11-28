import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { mongoClient } from "~/lib/mongodb.server";

export const loader = async ({ request }: LoaderArgs) => {
  const query = new URL(request.url).searchParams.get("q");

  const results = await(await mongoClient)
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
      { $limit: 5 },
      {
        $project: {
          _id: 1,
          name: 1,
          score: {
            $meta: "searchScore",
          },
        },
      },
    ])
    .toArray();

  return json(results);
};
