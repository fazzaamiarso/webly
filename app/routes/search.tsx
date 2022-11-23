import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { mongoClient } from "~/lib/mongodb.server";

export const loader = async () => {
  const results = await (
    await mongoClient
  )
    .db("webinar-app")
    .collection("Webinar")
    .aggregate([
      {
        $search: {
          text: {
            query: "licensed",
            path: {
              wildcard: "*",
            },
          },
        },
      },
    ])
    .toArray();
  return json(results);
};

export default function Search() {
  const webinars = useLoaderData<typeof loader>();

  return (
    <main className="w-11/12 mx-auto">
      <div className="w-full flex items-start py-8">
        {/* FILTER */}
        <section className="basis-[30%]">
          <h2 className="font-semibold text-lg">Filters</h2>
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
