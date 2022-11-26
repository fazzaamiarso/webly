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
      <section className="w-full">
        <h2 className="font-bold mb-8 text-lg">Featured Webinars</h2>
        <ul className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
          {webinars.map((w) => {
            return (
              <li key={w.id} className="w-full">
                <Link
                  to={`/shop/webinar/${w.id}`}
                  className="space-y-2 block w-full"
                >
                  <div className="h-32 sm:h-40 w-full overflow-hidden rounded-md">
                    <img
                      src={w.coverImg}
                      alt=""
                      className="bg-cover bg-center bg-no-repeat hover:scale-110 transition-all duration-500"
                    />
                  </div>
                  <div className="flex w-full justify-between text-sm">
                    <div className="">
                      <p className="font-medium md:text-base">{w.name}</p>
                      <p className="">Webinar host</p>
                    </div>
                    <span className="ml-auto md:text-base">
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
