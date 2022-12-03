import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, useTransition } from "@remix-run/react";
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
              Webinar: {
                select: {
                  name: true,
                  coverImg: true,
                  id: true,
                  seller: { select: { name: true } },
                },
              },
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
  invariant(typeof savedUser?.userId === "string", "Illegal that user is not exist!");

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
  const transition = useTransition();
  const isBusy = transition.state !== "idle";

  const cartSubTotal = `$${cart.reduce((acc, curr) => acc + curr.quantity * curr.Ticket.price, 0)}`;
  return (
    <main className="mx-auto w-11/12 max-w-2xl py-12">
      <section className="w-full space-y-8">
        <h2 className="mb-8 text-3xl font-bold">Ticket Cart</h2>
        {cart && cart.length > 0 ? (
          <ul className="flex w-full  flex-wrap items-center">
            {cart.map((c) => {
              const webinar = c.Ticket.Webinar;
              return (
                <CartItem
                  key={c.id}
                  id={c.id}
                  coverImg={webinar.coverImg}
                  name={webinar.name}
                  sellerName={webinar.seller.name}
                  price={c.Ticket.price}
                  quantity={c.quantity}
                  ticketId={c.ticketId}
                  isBusy={isBusy}
                />
              );
            })}
          </ul>
        ) : (
          <div className="flex w-full justify-center py-12">
            <p>Your cart is empty!</p>
          </div>
        )}
        <div className="flex flex-col gap-8">
          <div className="flex w-full items-center">
            <p className="text-lg">Subtotal</p>
            <div className="ml-auto text-lg">{cartSubTotal}</div>
          </div>
          <button className="w-full rounded-md bg-black p-2 text-white">Checkout</button>
          <p className="text-center">
            or{" "}
            <Link to="/shop" className="text-sm text-blue-500">
              Continue Browsing →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

type CartItemProps = {
  id: string;
  coverImg: string;
  name: string;
  sellerName: string;
  quantity: number;
  price: number;
  ticketId: string;
  isBusy: boolean;
};

const CartItem = ({
  id,
  coverImg,
  name,
  sellerName,
  quantity,
  price,
  isBusy,
  ticketId,
}: CartItemProps) => {
  const priceDisplay = price === 0 ? "Free" : `$${price}`;
  return (
    <li
      key={id}
      className="flex w-full items-start gap-5 border-t-[1px] border-gray-300 p-4 last:border-b-[1px]"
    >
      <div className="aspect-square h-16 overflow-hidden rounded-sm">
        <img src={coverImg} alt="" className="h-full object-cover object-center" />
      </div>
      <div className="flex w-full flex-col">
        <div className="flex">
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="">{sellerName}</p>
          </div>
          <div className="ml-auto space-x-4">
            <span className="">{quantity} x </span>
            <span className="font-semibold">{priceDisplay}</span>
          </div>
        </div>
        <Form replace method="post" className="ml-auto">
          <input key={quantity} type="number" name="qty" defaultValue={quantity} hidden />
          <button
            name="ticket-id"
            value={ticketId}
            disabled={isBusy}
            className="text-sm text-blue-500"
          >
            remove
          </button>
        </Form>
      </div>
    </li>
  );
}; 