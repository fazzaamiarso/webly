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
import { WebinarItem } from "~/components/webinar-item";
import { mongoClient } from "~/lib/mongodb.server";
import { prisma } from "~/lib/prisma.server";

const sorter = [
  { name: "Most Relevant", value: "MOST_RELEVANT" },
  { name: "Newest", value: "NEWEST" },
  { name: "Trending", value: "TRENDING" },
] as const;
type SorterValues = typeof sorter[number]["value"];

export const loader = async ({ request }: LoaderArgs) => {
  const query = new URL(request.url).searchParams.get("q");
  const pricingType = new URL(request.url).searchParams.getAll("price");
  const sort: SorterValues = (new URL(request.url).searchParams.get("sort") ??
    "MOST_RELEVANT") as SorterValues;
  const categories = new URL(request.url).searchParams.getAll("category");

  let pipeline: any = [
    {
      $search: {
        compound: {
          must: [],
          should: [],
          filter: [],
        },
      },
    },
    {
      $lookup: {
        from: "Ticket",
        localField: "_id",
        foreignField: "webinarId",
        as: "tickets",
      },
    },
  ];

  if (pricingType.length)
    pipeline[0].$search.compound.filter.push({
      text: {
        query: pricingType.length === 2 ? [...pricingType, "MIX"] : pricingType,
        path: "type",
      },
    });
  if (sort === "NEWEST") {
    pipeline.push({ $sort: { startDate: 1 } });
  }

  if (query?.length) {
    pipeline[0].$search.compound.must.push({
      text: {
        query,
        path: ["name"],
        fuzzy: {},
      },
    });
    pipeline[0].$search.compound.should.push(
      {
        text: {
          query,
          path: ["category"],
          fuzzy: {},
        },
      },
      {
        regex: {
          allowAnalyzedField: true,
          query: `*${query}*`,
          path: "name",
        },
      }
    );
  }

  if (categories.length) {
    pipeline[0].$search.compound.filter.push({
      text: {
        query: categories,
        path: "category",
      },
    });
  }

  const compound = pipeline[0].$search.compound;
  for (let key in compound) {
    if (compound[key].length === 0) delete compound[key];
  }
  if (Object.keys(compound).length === 0) pipeline.shift();

  const results = await(await mongoClient)
    .db("webinar-app")
    .collection("Webinar")
    .aggregate(pipeline)
    .toArray();

  //This is bad, maybe just use embedded document
  const withSeller = await Promise.all(
    results.map(async (w) => {
      const seller = await prisma.seller.findUnique({
        where: { id: w.sellerId.toString() },
        select: { name: true },
      });
      return { ...w, seller };
    })
  );

  return json(withSeller as any);
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function Search() {
  const submit = useSubmit();
  const webinars = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  return (
    <main className="w-11/12 mx-auto">
      <div className="w-full flex items-start py-8 gap-12">
        {/* FILTER */}
        <section className="basis-[20%]">
          <Form className="w-full" onChange={(e) => submit(e.currentTarget)}>
            <h2 className="font-semibold text-lg mb-6">Filters</h2>
            <input
              type="text"
              hidden
              defaultValue={searchParams.get("q") ?? ""}
              name="q"
            />
            <fieldset className="space-y-2 border-b-[1px] py-4 text-sm ">
              <div className="w-full flex items-center justify-between">
                <legend className="font-semibold">Categories</legend>
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
                  {searchParams.getAll("category").length === 0
                    ? "All Categories"
                    : searchParams
                        .getAll("category")
                        .map(capitalize)
                        .join(", ")}
                </div>
              )}
              {isCategoryOpen && (
                <div className="space-y-3 pt-4">
                  {Object.keys(Category).map((c) => {
                    return (
                      <label
                        key={c + searchParams.getAll("category").includes(c)}
                        className="flex items-center gap-4 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="category"
                          id={c}
                          defaultValue={c}
                          defaultChecked={searchParams
                            .getAll("category")
                            .includes(c)}
                          className="rounded-sm"
                        />
                        <span>{capitalize(c)}</span>
                      </label>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      searchParams.delete("category");
                      submit(searchParams);
                    }}
                    className="text-sm text-blue-500"
                  >
                    Reset
                  </button>
                </div>
              )}
            </fieldset>
            <fieldset className="border-b-[1px] py-4 text-sm ">
              <div className="w-full flex items-center justify-between">
                <legend className="font-semibold">Price</legend>
                <button
                  type="button"
                  onClick={() => setIsPricingOpen(!isPricingOpen)}
                >
                  <ChevronDownIcon
                    className={
                      isPricingOpen
                        ? "w-5 rotate-180 transition-all"
                        : "w-5 transition-all"
                    }
                  />
                </button>
              </div>
              {!isPricingOpen && (
                <div className="text-sm">
                  {searchParams.getAll("price").length === 0
                    ? "All Price"
                    : searchParams.getAll("price").map(capitalize).join(", ")}
                </div>
              )}
              {isPricingOpen && (
                <div className="space-y-3 pt-4">
                  <label className="flex items-center gap-4 text-sm">
                    <input
                      type="checkbox"
                      name="price"
                      id="FREE"
                      defaultValue="FREE"
                      defaultChecked={searchParams
                        .getAll("price")
                        .includes("FREE")}
                      className="rounded-sm"
                    />
                    <span>Free</span>
                  </label>
                  <label className="flex items-center gap-4 text-sm">
                    <input
                      type="checkbox"
                      name="price"
                      id="PAID"
                      defaultValue="PAID"
                      defaultChecked={searchParams
                        .getAll("price")
                        .includes("PAID")}
                      className="rounded-sm"
                    />
                    <span>Paid</span>
                  </label>
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
              value={searchParams.get("sort") ?? "MOST_RELEVANT"}
              name="sort"
              className="text-sm border-none font-semibold"
              onChange={(e) => {
                searchParams.delete("sort");
                const data = new URLSearchParams([
                  ...Array.from(searchParams.entries()),
                  ...Object.entries({ sort: e.target.value }),
                ]);
                submit(data);
              }}
            >
              {sorter.map((s) => (
                <option key={s.value} defaultValue={s.value}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <ul className="w-full pt-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-6 gap-y-8">
            {webinars.map((w: any) => (
              <WebinarItem
                key={w._id}
                id={w._id}
                cover={w.coverImg}
                name={w.name}
                startDate={w.startDate}
                tickets={w.tickets}
                seller={w.seller?.name}
              />
            ))}
          </ul>
        </section>
        {/* PRODUCTS END */}
      </div>
    </main>
  );
}
