import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";

export const loader = async () => {
  const webinars = await prisma.webinar.findMany();
  return json(webinars);
};

export default function Index() {
  const webinars = useLoaderData<typeof loader>();

  return (
    <main className="w-11/12 mx-auto">
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
    </main>
  );
}
