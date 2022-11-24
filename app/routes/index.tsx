import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";

export const loader = async () => {
  const webinars = await prisma.webinar.findMany({
    take: 10,
    include: { Tickets: true },
  });
  return json(webinars);
};

export default function Index() {
  const webinars = useLoaderData<typeof loader>();

  return (
    <main className="w-11/12 mx-auto space-y-12">
      <section className="w-full h-80 bg-gradient-to-bl from-green-300 via-yellow-300 to-pink-300"></section>
      <section>
        <h2 className="font-bold mb-8 text-lg">Featured Webinars</h2>
        <ul className="flex items-center gap-8 flex-wrap">
          {webinars.map((w) => {
            return (
              <li key={w.id} className="basis-[22%]">
                <Link
                  to={`/webinar/${w.id}`}
                  className="space-y-2 block w-full"
                >
                  <div className="h-40 w-full overflow-hidden rounded-md">
                    <img
                      src={w.coverImg}
                      alt=""
                      className="bg-cover bg-center bg-no-repeat"
                    />
                  </div>
                  <div className="flex w-full justify-between gap-8">
                    <div>
                      <p>{w.name}</p>
                      <p className="text-sm">Webinar host</p>
                    </div>
                    <span className="">
                      ${w.Tickets.reduce((acc, curr) => acc + curr.price, 0)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
