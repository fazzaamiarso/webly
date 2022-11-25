import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { prisma } from "~/lib/prisma.server";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  const savedUser = await authenticator.isAuthenticated(request);
  const user = await prisma.user.findUnique({
    where: { id: savedUser?.userId },
    select: { cart: true },
  });

  const cart = await prisma.ticket.findMany({
    where: { id: { in: user?.cart } },
    include: { Webinar: { select: { name: true } } },
  });

  return json(cart);
};

export default function Cart() {
  const cart = useLoaderData<typeof loader>();

  return (
    <main className="w-11/12 max-w-lg mx-auto ">
      <section className="w-full">
        <h2 className="font-bold mb-8 text-lg">Shopping Cart</h2>
        {cart && cart.length > 0 ? (
          <ul className="flex items-center gap-8 flex-wrap">
            {cart.map((c) => {
              return (
                <li key={c.id} className="w-full p-4">
                  <h3>{c.Webinar.name}</h3>
                  <div>${c.price}</div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Your cart are empty!</p>
        )}
        <div className="flex flex-col">
          <button className="w-full bg-black text-white">Checkout</button>
          <p>
            continue to checkout or{" "}
            <Link to="/shop" className="text-blue-500">
              search more webinar
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
