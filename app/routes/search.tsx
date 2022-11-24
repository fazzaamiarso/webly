import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Category } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useState } from "react";
import { mongoClient } from "~/lib/mongodb.server";
import { prisma } from "~/lib/prisma.server";

export const loader = async ({ request }: LoaderArgs) => {
  const query = new URL(request.url).searchParams.get("q");
  const categories = new URL(request.url).searchParams.getAll("category");

  if (!query) return json(await prisma.webinar.findMany());

  let pipeline: any = [
    {
      $search: {
        compound: {
          must: [
            {
              text: {
                query,
                path: {
                  wildcard: "*",
                },
                fuzzy: {},
              },
            },
          ],
        },
      },
    },
    {
      $project: { _id: false },
    },
    {
      $addFields: { id: "$_id" },
    },
  ];

  if (categories.length)
    pipeline[0].$search.compound.filter = [
      {
        text: {
          query: categories,
          path: "category",
        },
      },
    ];

  const results = await(await mongoClient)
    .db("webinar-app")
    .collection("Webinar")
    .aggregate(pipeline)
    .toArray();

  return json(results);
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function Search() {
  const submit = useSubmit();
  const webinars = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const [isCategoryOpen, setIsCategoryOpen] = useState(true);

  return (
    <main className="w-11/12 mx-auto">
      <div className="w-full flex items-start py-8 gap-12">
        {/* FILTER */}
        <section className="basis-[30%]">
          <Form className="w-full" onChange={(e) => submit(e.currentTarget)}>
            <h2 className="font-semibold text-lg mb-6">Filters</h2>
            <input
              type="text"
              hidden
              defaultValue={searchParams.get("q") ?? ""}
              name="q"
            />
            <fieldset className="space-y-4">
              <div className="w-full flex items-center justify-between">
                <legend>Categories</legend>
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                >
                  <ChevronDownIcon
                    className={
                      isCategoryOpen
                        ? "w-5 rotate-180 transition-all"
                        : "w-5 transition-all"
                    }
                  />
                </button>
              </div>
              <div className="space-y-1">
                {Object.keys(Category).map((c) => {
                  return (
                    <label key={c} className="flex items-center gap-4 text-sm">
                      <input type="checkbox" name="category" id={c} value={c} />
                      <span>{capitalize(c)}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </Form>
        </section>
        {/* FILTER END */}
        {/* PRODUCTS */}
        <section className="basis-full">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg">Webinars</h2>
            <p className="text-sm">{webinars.length} results</p>
          </div>
          <ul className="flex items-center gap-8 flex-wrap">
            {webinars.map((w) => {
              return (
                <li key={w.id} className="w-max">
                  <div className="h-40 w-52">
                    <img
                      src={w.coverImg}
                      alt=""
                      className="rounded-md bg-cover bg-center"
                    />
                  </div>
                  <div className="flex w-full justify-between gap-8">
                    <p>{w.name}</p>
                    <span className="">$20</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
        {/* PRODUCTS END */}
      </div>
    </main>
  );
}
