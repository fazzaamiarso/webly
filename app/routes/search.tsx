import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Category } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Form,
  Link,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from "@remix-run/react";
import { useState } from "react";
import { mongoClient } from "~/lib/mongodb.server";
import { prisma } from "~/lib/prisma.server";

const sorter = [
  { name: "Most Relevant", value: "MOST_RELEVANT" },
  { name: "Newest", value: "NEWEST" },
  { name: "Trending", value: "TRENDING" },
] as const;

export const loader = async ({ request }: LoaderArgs) => {
  const query = new URL(request.url).searchParams.get("q");
  const sort: typeof sorter[number]["value"] = (new URL(
    request.url
  ).searchParams.get("sort") ??
    "MOST_RELEVANT") as typeof sorter[number]["value"];
  const categories = new URL(request.url).searchParams.getAll("category");

  let pipeline: any = [
    {
      $search: {
        compound: {},
      },
    },
    {
      $lookup: {
        from: "Ticket",
        localField: "_id",
        foreignField: "webinarId",
        as: "price",
      },
    },
    {
      $addFields: {
        id: "$_id",
        calc: {
          $reduce: {
            input: "$price.price",
            initialValue: 0,
            in: { $add: ["$$value", "$$this"] },
          },
        },
      },
    },
    {
      $project: { _id: false, price: false },
    },
  ];

  if (!query?.length && !categories.length)
    return json(
      await prisma.webinar.findMany({
        include: { Tickets: { select: { price: true } } },
      })
    );

  //TODO: implement sort
  if (sort === "NEWEST") {
    pipeline.push({ $sort: { registrationOpen: -1 } });
  }

  if (categories.length)
    pipeline[0].$search.compound.filter = [
      {
        text: {
          query: categories,
          path: "category",
        },
      },
    ];

  if (query?.length)
    pipeline[0].$search.compound.must = [
      {
        text: {
          query,
          path: "name",
          fuzzy: {},
        },
      },
    ];

  const results = await (await mongoClient)
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
              {!isCategoryOpen && (
                <div className="text-sm">
                  {searchParams.getAll("category").map(capitalize).join(", ")}
                </div>
              )}
              {isCategoryOpen && (
                <div className="space-y-1">
                  {Object.keys(Category).map((c) => {
                    return (
                      <label
                        key={c}
                        className="flex items-center gap-4 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="category"
                          id={c}
                          value={c}
                          defaultChecked={searchParams
                            .getAll("category")
                            .includes(c)}
                        />
                        <span>{capitalize(c)}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
          </Form>
        </section>
        {/* FILTER END */}
        {/* PRODUCTS */}
        <section className="basis-full">
          <div className="flex w-full justify-between">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-lg">Webinars</h2>
              <p className="text-sm">{webinars.length} results</p>
            </div>
            <select
              name="sort"
              className="text-sm border-none font-semibold"
              onChange={(e) => {
                const data = new URLSearchParams([
                  ...Array.from(searchParams.entries()),
                  ...Object.entries({ sort: e.target.value }),
                ]);
                submit(data);
              }}
            >
              {sorter.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <ul className="w-full flex items-center justify-between gap-8 flex-wrap">
            {webinars.map((w) => {
              return (
                <li key={w.id} className="basis-[22%]">
                  <Link to={`/webinar/${w.id}`}>
                    <div className="h-40 w-52">
                      <img
                        src={w.coverImg}
                        alt=""
                        className="rounded-md bg-cover bg-center"
                      />
                    </div>
                    <div className="flex w-full justify-between gap-8">
                      <div>
                        <p className="line-clamp-1 font-semibold text-sm">
                          {w.name}
                        </p>
                        <p className="text-sm">Webinar Host</p>
                      </div>
                      <span className="">
                        $
                        {w.calc ??
                          w.Tickets.reduce(
                            (acc: number, curr: { price: number }) =>
                              acc + curr.price,
                            0
                          )}
                      </span>
                    </div>
                  </Link>
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
