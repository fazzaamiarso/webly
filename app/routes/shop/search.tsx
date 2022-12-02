import { Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Category, TicketType } from "@prisma/client";
import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData, useSearchParams, useSubmit } from "@remix-run/react";
import type { ReactNode } from "react";
import { useId, useState } from "react";
import { z } from "zod";
import { WebinarItem } from "~/components/webinar-item";
import { mongoClient } from "~/lib/mongodb.server";
import { capitalize } from "~/utils/display";

const webinarSearchSchema = z.object({
  _id: z.any(),
  name: z.string(),
  type: z.nativeEnum(TicketType),
  startDate: z.date(),
  category: z.nativeEnum(Category),
  coverImg: z.string(),
  sellerName: z.string(),
  tickets: z.array(z.object({ price: z.number() })),
});

const sorter = [
  { name: "Most Relevant", value: "MOST_RELEVANT" },
  { name: "Soonest", value: "SOONEST" },
] as const;
type SorterValues = typeof sorter[number]["value"];

type AggLookup = {
  from: string;
  localField: string;
  foreignField: string;
  as: string;
  pipeline?: {}[];
};
const lookup = (obj: AggLookup) => {
  return { $lookup: obj } as const;
};

const searchOperator = (operator: "text" | "regex" | "wildcard", option: Record<string, any>) => {
  return { [operator]: option };
};
export const loader = async ({ request }: LoaderArgs) => {
  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q");
  const pricingType = searchParams.getAll("price");
  const sort: SorterValues = (searchParams.get("sort") ?? "MOST_RELEVANT") as SorterValues;
  const categories = searchParams.getAll("category");
  const searchIntent = searchParams.get("intent") ?? "webinar";

  const priceFilter = pricingType.length
    ? pricingType.length === 2
      ? [...pricingType, "MIX"]
      : pricingType
    : Object.keys(TicketType);

  const categoryFilter = categories.length ? categories : Object.keys(Category);

  const sellerPipeline = [
    {
      $search: {
        index: "seller-autocomplete",
        compound: {
          must: [],
          should: [],
          filter: [],
        },
      },
    },
    lookup({
      from: "Webinar",
      localField: "_id",
      foreignField: "sellerId",
      as: "webinars",
      pipeline: [
        {
          $match: {
            $and: [
              {
                $expr: {
                  $in: ["$category", categoryFilter],
                },
              },
              {
                $expr: {
                  $in: ["$type", priceFilter],
                },
              },
            ],
          },
        },
      ],
    }),
  ];

  let webinarPipeline: any = [
    {
      $search: {
        compound: {
          must: [],
          should: [],
          filter: [
            searchOperator("text", {
              query: categoryFilter,
              path: "category",
            }),
            searchOperator("text", {
              query: priceFilter,
              path: "type",
            }),
          ],
        },
      },
    },
    lookup({
      from: "Seller",
      localField: "sellerId",
      foreignField: "_id",
      as: "seller",
    }),
    lookup({
      from: "Ticket",
      localField: "_id",
      foreignField: "webinarId",
      as: "tickets",
    }),
    { $unwind: "$seller" },
    {
      $project: {
        name: 1,
        type: 1,
        startDate: 1,
        category: 1,
        coverImg: 1,
        sellerName: "$seller.name",
        tickets: 1,
      },
    },
  ];

  const pipeline = searchIntent === "webinar" ? webinarPipeline : sellerPipeline;

  if (query?.length) {
    pipeline[0].$search.compound.must.push(
      searchOperator("text", {
        query,
        path: "name",
        fuzzy: {},
      })
    );
    pipeline[0].$search.compound.should.push(
      searchOperator("text", {
        query,
        path: "category",
        fuzzy: {},
      }),
      searchOperator("regex", {
        allowAnalyzedField: true,
        query: `*${query}*`,
        path: "name",
      })
    );
  }

  if (searchIntent === "seller") {
    pipeline.push(
      { $unwind: "$webinars" },
      lookup({
        from: "Ticket",
        localField: "webinars._id",
        foreignField: "webinarId",
        as: "tickets",
      }),
      {
        $project: {
          _id: "$webinars._id",
          name: "$webinars.name",
          type: "$webinars.type",
          startDate: "$webinars.startDate",
          category: "$webinars.category",
          coverImg: "$webinars.coverImg",
          sellerName: "$name",
          tickets: "$tickets",
        },
      }
    );
  }

  if (sort === "SOONEST") {
    pipeline.push({ $sort: { startDate: 1 } });
  }

  // remove empty search compound fields causing errror
  const compound = pipeline[0].$search.compound;
  for (let key in compound) {
    if (compound[key].length === 0) delete compound[key];
  }
  if (Object.keys(compound).length === 0) pipeline.shift();

  const collection = searchIntent === "webinar" ? "Webinar" : "Seller";
  const results = await (await mongoClient)
    .db("webinar-app")
    .collection(collection)
    .aggregate(pipeline)
    .toArray();

  const parsed = z.array(webinarSearchSchema).parse(results);
  return json(parsed);
};

export default function Search() {
  const submit = useSubmit();
  const webinars = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  return (
    <main className="mx-auto w-11/12">
      <div className="flex w-full items-start gap-12 py-8">
        {/* FILTER */}
        <section className="basis-[20%]">
          <Form className="w-full" onChange={(e) => submit(e.currentTarget)}>
            <h2 className="mb-6 text-lg font-semibold">Filters</h2>
            <input type="text" hidden defaultValue={searchParams.get("q") ?? ""} name="q" />
            <input
              type="text"
              hidden
              defaultValue={searchParams.get("intent") ?? "webinar"}
              name="intent"
            />
            <FilterWrapper fieldName="category" title="Categories">
              {({ isOpen }) =>
                isOpen && (
                  <div className="space-y-3 py-4">
                    {Object.keys(Category).map((c) => (
                      <FilterCheckbox
                        key={c}
                        defaultValue={c}
                        fieldName="category"
                        displayValue={capitalize(c)}
                      />
                    ))}
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
                )
              }
            </FilterWrapper>
            <FilterWrapper fieldName="price" title="Price">
              {({ isOpen }) =>
                isOpen && (
                  <div className="space-y-3 py-4">
                    <FilterCheckbox defaultValue="FREE" fieldName="price" displayValue="Free" />
                    <FilterCheckbox defaultValue="PAID" fieldName="price" displayValue="Paid" />
                  </div>
                )
              }
            </FilterWrapper>
          </Form>
        </section>
        {/* FILTER END */}
        {/* PRODUCTS */}
        <section className="basis-full">
          <div className="flex w-full justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Webinars</h2>
              <p className="text-sm">{webinars.length} results</p>
            </div>
            <select
              value={searchParams.get("sort") ?? "MOST_RELEVANT"}
              name="sort"
              className="border-none text-sm font-semibold"
              onChange={(e) => {
                searchParams.delete("sort");
                searchParams.append("sort", e.target.value);
                submit(searchParams);
              }}
            >
              {sorter.map((s) => {
                return (
                  <option key={s.value} defaultValue={s.value} value={s.value}>
                    {s.name}
                  </option>
                );
              })}
            </select>
          </div>
          <ul className="grid w-full grid-cols-2 gap-6 gap-y-8 pt-4  lg:grid-cols-3 xl:grid-cols-4">
            {webinars.map((w) => (
              <WebinarItem
                key={w._id.toString()}
                id={w._id.toString()}
                cover={w.coverImg}
                name={w.name}
                startDate={w.startDate}
                tickets={w.tickets}
                seller={w.sellerName}
              />
            ))}
          </ul>
        </section>
        {/* PRODUCTS END */}
      </div>
    </main>
  );
}

type FilterWrapperProps = {
  children: ({ isOpen }: { isOpen: boolean }) => ReactNode;
  title: string;
  fieldName: string;
};
const FilterWrapper = ({ children, title, fieldName }: FilterWrapperProps) => {
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const paramValues = searchParams.getAll(fieldName);
  return (
    <fieldset className="border-b-[1px] text-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full flex-col py-4 "
      >
        <span className="flex w-full items-center justify-between">
          <span className="font-semibold">{title}</span>
          <span>
            <ChevronDownIcon
              className={
                isOpen
                  ? "w-5 rotate-180 transition-all duration-300"
                  : "w-5 transition-all duration-300"
              }
            />
          </span>
        </span>
        {!isOpen && (
          <span className="pt-2 text-sm" aria-hidden="true">
            {paramValues.length === 0 ? null : paramValues.map(capitalize).join(", ")}
          </span>
        )}
      </button>
      <Transition
        show={isOpen}
        enterFrom="scale-y-0 opacity-0"
        enter="duration-200 origin-top"
        enterTo="scale-y-100 opacity-100"
        leave="duration-200 origin-top"
        leaveTo="scale-y-0 opacity-0"
        leaveFrom="scale-y-100 opacity-100"
      >
        {children({ isOpen })}
      </Transition>
    </fieldset>
  );
};

type FilterCheckboxProps = {
  defaultValue: string;
  displayValue: string;
  fieldName: string;
};
const FilterCheckbox = ({ defaultValue, displayValue, fieldName }: FilterCheckboxProps) => {
  const id = useId();
  const [searchParams] = useSearchParams();

  const checked = searchParams.getAll(fieldName).includes(defaultValue);
  return (
    <label key={fieldName + id} className="flex items-center gap-4 text-sm">
      <input
        key={String(checked)}
        type="checkbox"
        name={fieldName}
        id={id}
        defaultValue={defaultValue}
        defaultChecked={checked}
        className="rounded-sm"
      />
      <span>{displayValue}</span>
    </label>
  );
};
