import { PlusIcon } from "@heroicons/react/24/outline";
import { Category } from "@prisma/client";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { mongoClient } from "~/lib/mongodb.server";

export const loader = async () => {
  const results = await(await mongoClient)
    .db("webinar-app")
    .collection("Webinar")
    .aggregate([
      {
        $search: {
          text: {
            query: "mode",
            path: {
              wildcard: "*",
            },
            fuzzy: {},
          },
        },
      },
    ])
    .toArray();
  return json(results);
};

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function Search() {
  const webinars = useLoaderData<typeof loader>();
  return (
    <main className="w-11/12 mx-auto">
      <div className="w-full flex items-start py-8 gap-12">
        {/* FILTER */}
        <section className="basis-[30%]">
          <Form className="w-full">
            <h2 className="font-semibold text-lg mb-6">Filters</h2>
            <fieldset className="space-y-4">
              <div className="w-full flex items-center justify-between">
                <legend>Categories</legend>
                <button type="button">
                  <PlusIcon className="w-5" />
                </button>
              </div>
              <div className="space-y-1">
                {Object.keys(Category).map((c) => {
                  return (
                    <label key={c} className="flex items-center gap-4 text-sm">
                      <input type="checkbox" name="category" />
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
          <h2 className="font-semibold text-lg">Webinars</h2>
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
