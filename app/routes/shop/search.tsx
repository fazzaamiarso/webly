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
import type { ReactNode } from "react";
import { Fragment } from "react";
import { useId, useState } from "react";
import { WebinarItem } from "~/components/webinar-item";
import { mongoClient } from "~/lib/mongodb.server";

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
        from: "Seller",
        localField: "sellerId",
        foreignField: "_id",
        as: "seller",
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

  if (query?.length) {
    pipeline[0].$search.compound.should.push({
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

  if (sort === "NEWEST") {
    pipeline.push({ $sort: { startDate: 1 } });
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

  return json(results);
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function Search() {
  const submit = useSubmit();
  const webinars = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();

  return (
    <main className="w-11/12 mx-auto">
      <div className="w-full flex items-start py-8 gap-12">
        {/* FILTER */}
        <section className="basis-[20%]">
          <Form className="w-full" onChange={(e) => submit(e.currentTarget)}>
            <h2 className="font-semibold text-lg mb-6">Filters</h2>
            <input type="text" hidden defaultValue={searchParams.get("q") ?? ""} name="q" />
            <FilterWrapper fieldName="category" title="Categories">
              {({ isOpen }) =>
                isOpen && (
                  <div className="space-y-3 pt-4">
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
                  <div className="space-y-3 pt-4">
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
              <h2 className="font-semibold text-lg">Webinars</h2>
              <p className="text-sm">{webinars.length} results</p>
            </div>
            <select
              value={searchParams.get("sort") ?? "MOST_RELEVANT"}
              name="sort"
              className="text-sm border-none font-semibold"
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
          <ul className="w-full pt-4 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4  gap-6 gap-y-8">
            {webinars.map((w: any) => (
              <WebinarItem
                key={w._id}
                id={w._id}
                cover={w.coverImg}
                name={w.name}
                startDate={w.startDate}
                tickets={w.tickets}
                seller={w.seller[0].name}
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
    <fieldset className={"border-b-[1px] py-4 text-sm"}>
      <div className="w-full flex items-center justify-between">
        <legend className="font-semibold">{title}</legend>
        <button type="button" onClick={() => setIsOpen((prev) => !prev)}>
          <ChevronDownIcon
            className={isOpen ? "w-5 rotate-180 transition-all" : "w-5 transition-all"}
          />
        </button>
      </div>
      {!isOpen && (
        <div className="text-sm mt-2">
          {paramValues.length === 0 ? null : paramValues.map(capitalize).join(", ")}
        </div>
      )}
      {isOpen && <Fragment>{children({ isOpen })}</Fragment>}
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