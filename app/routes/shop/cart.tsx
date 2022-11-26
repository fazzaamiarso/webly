import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import { prisma } from "~/lib/prisma.server";
import { authenticator } from "~/utils/auth.server";

export const loader = async ({ request }: LoaderArgs) => {
  const savedUser = await authenticator.isAuthenticated(request);
  const user = await prisma.user.findUnique({
    where: { id: savedUser?.userId },
    select: {
      cart: {
        select: {
          id: true,
          ticketId: true,
          quantity: true,
          Ticket: {
            select: {
              price: true,
              Webinar: { select: { name: true, coverImg: true } },
            },
          },
        },
      },
    },
  });

  return json(user?.cart);
};

export const action = async ({ request }: ActionArgs) => {
  const formData = await request.formData();
  const ticketId = formData.get("ticket-id");
  const quantity = formData.get("qty");
  const savedUser = await authenticator.isAuthenticated(request);

  invariant(typeof ticketId === "string", "ticketId must be a string!");
  invariant(typeof quantity === "string", "quantity must be a string!");
  invariant(
    typeof savedUser?.userId === "string",
    "Illegal that user is not exist!"
  );

  console.log(quantity);
  if (Number(quantity) <= 1) {
    await prisma.cart.delete({
      where: { userId_ticketId: { ticketId, userId: savedUser.userId } },
    });
  } else {
    await prisma.cart.update({
      where: { userId_ticketId: { ticketId, userId: savedUser.userId } },
      data: { quantity: { decrement: 1 } },
    });
  }

  return json(null);
};

export default function Cart() {
  const cart = useLoaderData<typeof loader>();
  return (
    <main className="w-11/12 max-w-2xl mx-auto py-12">
      <section className="w-full space-y-8">
        <h2 className="font-bold mb-8 text-3xl">Shopping Cart</h2>
        {cart && cart.length > 0 ? (
          <ul className="flex items-center gap-8 flex-wrap">
            {cart.map((c) => {
              return (
                <li key={c.id} className="w-full p-4 flex items-start gap-2">
                  <div className="h-16 aspect-square rounded-sm overflow-hidden">
                    <img
                      src={c.Ticket.Webinar.coverImg}
                      alt=""
                      className="object-cover object-center h-full"
                    />
                  </div>
                  <div>
                    <h3>{c.Ticket.Webinar.name}</h3>
                    <p>Webinar Host</p>
                  </div>
                  <div>
                    <div className="ml-auto">
                      <span>{c.quantity} x </span>
                      <span className="font-semibold">${c.Ticket.price}</span>
                    </div>
                    <Form method="post">
                      <input
                        key={c.quantity}
                        type="number"
                        name="qty"
                        defaultValue={c.quantity}
                        hidden
                      />
                      <button
                        name="ticket-id"
                        value={c.ticketId}
                        className="text-blue-500"
                      >
                        Remove
                      </button>
                    </Form>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Your cart are empty!</p>
        )}
        <div className="flex flex-col">
          <button className="w-full bg-black text-white p-2 rounded-md">
            Checkout
          </button>
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
